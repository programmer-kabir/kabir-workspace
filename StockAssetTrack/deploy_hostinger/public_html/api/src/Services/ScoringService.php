<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Computes asset download velocity, performance scores, and niche opportunity metrics.
 */
final class ScoringService
{
    private const SECONDS_PER_MONTH = 2629800.0; // 30.4375 days

    /**
     * @param array{competitionLowMax: int, competitionMediumMax: int} $thresholds
     */
    public function __construct(private readonly array $thresholds)
    {
    }

    /**
     * Calculate rounded monthly downloads (~D/M), returning null when creationDate is absent or invalid.
     */
    public function calcMonthlyVelocity(int $downloads, ?string $creationDate): ?int
    {
        if ($creationDate === null || trim($creationDate) === '') {
            return null;
        }

        $timestamp = strtotime($creationDate);
        if ($timestamp === false) {
            return null;
        }

        $elapsedSeconds = max(0, time() - $timestamp);
        $months = max(1.0, $elapsedSeconds / self::SECONDS_PER_MONTH);

        return (int) round($downloads / $months);
    }

    /**
     * Calibrated 0-100 asset performance score derived from monthly velocity.
     */
    public function calcPerformanceScore(?int $velocity): int
    {
        if ($velocity === null || $velocity <= 0) {
            return 0;
        }
        if ($velocity <= 10) {
            return (int) min(40, round($velocity * 4));
        }
        if ($velocity <= 40) {
            return (int) round(40 + (($velocity - 10) / 30) * 35);
        }

        return (int) min(100, round(75 + (($velocity - 40) / 70) * 25));
    }

    public function classifyCompetition(int $totalResults): string
    {
        if ($totalResults < $this->thresholds['competitionLowMax']) {
            return 'Low';
        }
        if ($totalResults <= $this->thresholds['competitionMediumMax']) {
            return 'Medium';
        }

        return 'High';
    }

    /**
     * Build the Market Summary payload across normalized assets and aggregate counts.
     *
     * @param array<int, array<string, mixed>> $assets
     * @param array{photo: int, illustration: int, vector: int, video: int} $typeCounts
     * @param array{aiCount: int, realCount: int} $aiSplit
     * @return array<string, mixed>
     */
    public function buildSearchSummary(
        string $query,
        array $assets,
        int $totalResults,
        array $typeCounts,
        array $aiSplit
    ): array {
        $demandScore = $this->calcDemandScore($assets);
        $competitionScore = $this->calcCompetitionScore($totalResults);
        $opportunityIndex = (int) max(1, min(100, round(0.6 * $demandScore + 0.4 * (100 - $competitionScore))));

        $aiTotal = max(1, $aiSplit['aiCount'] + $aiSplit['realCount']);
        $aiPercent = (int) round(($aiSplit['aiCount'] / $aiTotal) * 100);

        return [
            'query' => $query,
            'totalResults' => $totalResults,
            'demandScore' => $demandScore,
            'competitionScore' => $competitionScore,
            'opportunityIndex' => $opportunityIndex,
            'competitionLevel' => $this->classifyCompetition($totalResults),
            'trendType' => $this->classifyTrend($query, $assets),
            'typeCounts' => $typeCounts,
            'aiSplit' => [
                'aiCount' => $aiSplit['aiCount'],
                'realCount' => $aiSplit['realCount'],
                'aiPercent' => $aiPercent,
            ],
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $assets
     */
    private function calcDemandScore(array $assets): int
    {
        if ($assets === []) {
            return 1;
        }

        $topSlice = array_slice($assets, 0, 20);
        $velocities = [];
        $topDownloads = 0;

        foreach ($topSlice as $asset) {
            $topDownloads += (int) ($asset['downloads'] ?? 0);
            if (is_int($asset['monthlyVelocity'] ?? null)) {
                $velocities[] = $asset['monthlyVelocity'];
            }
        }

        $avgVelocity = $velocities === [] ? 0.0 : array_sum($velocities) / count($velocities);
        $avgDownloads = $topDownloads / count($topSlice);

        $velocityComponent = min(65.0, ($avgVelocity / 60.0) * 65.0);
        $volumeComponent = min(35.0, (log10(max(1.0, $avgDownloads)) / 4.5) * 35.0);

        return (int) max(1, min(100, round($velocityComponent + $volumeComponent)));
    }

    private function calcCompetitionScore(int $totalResults): int
    {
        if ($totalResults <= 0) {
            return 1;
        }

        // Log-scaled saturation: 1k -> ~35, 100k -> ~59, 10M -> ~82, 250M -> 100
        $scaled = (log10((float) $totalResults) / 8.4) * 100.0;
        return (int) max(1, min(100, round($scaled)));
    }

    /**
     * @param array<int, array<string, mixed>> $assets
     */
    private function classifyTrend(string $query, array $assets): string
    {
        $lower = strtolower($query);
        $seasonalTerms = ['eid', 'ramadan', 'christmas', 'halloween', 'valentine', 'new year', 'black friday', 'autumn', 'winter'];
        foreach ($seasonalTerms as $term) {
            if (str_contains($lower, $term)) {
                return 'Seasonal Spike';
            }
        }

        $recentHighVelocity = 0;
        foreach (array_slice($assets, 0, 15) as $asset) {
            if (($asset['monthlyVelocity'] ?? 0) >= 25 && $this->isWithinDays($asset['creationDate'] ?? null, 180)) {
                $recentHighVelocity++;
            }
        }

        return $recentHighVelocity >= 3 ? 'Breakout Trending' : 'Evergreen';
    }

    private function isWithinDays(?string $creationDate, int $days): bool
    {
        if ($creationDate === null || trim($creationDate) === '') {
            return false;
        }
        $ts = strtotime($creationDate);
        if ($ts === false) {
            return false;
        }

        return (time() - $ts) <= ($days * 86400);
    }
}
