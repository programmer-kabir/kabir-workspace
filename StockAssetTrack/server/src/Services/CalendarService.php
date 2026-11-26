<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Cache;

/**
 * Computes 60-90 day predictive seasonal upload windows dynamically anchored to the current date.
 */
final class CalendarService
{
    private const CACHE_TTL_SECONDS = 43200; // 12 hours

    /** @var array<int, array<string, mixed>> */
    private const ANNUAL_EVENTS = [
        [
            'slug' => 'new-year-reset',
            'name' => 'New Year Goals & Wellness Reset',
            'monthDay' => '01-01',
            'category' => 'Seasonal',
            'region' => 'global',
            'leadDays' => 75,
            'demandScore' => 94,
            'competitionLevel' => 'High',
            'primaryQuery' => 'new year fitness goal planning',
            'subNiches' => ['minimalist planner mockup', 'healthy meal prep', 'digital detox workspace', '2027 calendar template'],
            'aiNote' => 'High demand for clean flat-lay productivity scenes and modern minimalist goal illustrations.',
        ],
        [
            'slug' => 'lunar-new-year',
            'name' => 'Lunar New Year / Spring Festival',
            'monthDay' => '02-06',
            'category' => 'Holidays',
            'region' => 'asia',
            'leadDays' => 75,
            'demandScore' => 89,
            'competitionLevel' => 'Medium',
            'primaryQuery' => 'lunar new year lantern gold',
            'subNiches' => ['red envelope mockup', 'minimalist paper cut dragon', 'asian calligraphy gold border', 'festive dining flat lay'],
            'aiNote' => '3D paper-cut art and modern luxury red-and-gold product podiums perform well.',
        ],
        [
            'slug' => 'valentines-day',
            'name' => "Valentine's Day & E-Commerce Gifting",
            'monthDay' => '02-14',
            'category' => 'Holidays',
            'region' => 'global',
            'leadDays' => 70,
            'demandScore' => 92,
            'competitionLevel' => 'High',
            'primaryQuery' => 'minimalist valentine gift aesthetic',
            'subNiches' => ['luxury perfume podium pastel', 'romantic dinner flat lay', 'love typography badge vector', 'rose botanical macro'],
            'aiNote' => 'Stand out by avoiding generic red hearts; focus on boutique editorial packaging and soft terracotta tones.',
        ],
        [
            'slug' => 'ramadan-eid',
            'name' => 'Ramadan Kareem & Eid al-Fitr Prep',
            'monthDay' => '02-18',
            'category' => 'Holidays',
            'region' => 'global',
            'leadDays' => 80,
            'demandScore' => 95,
            'competitionLevel' => 'Medium',
            'primaryQuery' => 'ramadan lantern gold minimalist',
            'subNiches' => ['ramadan kareem background', 'islamic geometric arch 3d', 'dates coffee crescent minimal', 'eid greeting template'],
            'aiNote' => 'Strong early-upload multiplier for luxury brass arches, crescent moon bokeh, and editable vectors.',
        ],
        [
            'slug' => 'q1-fintech-tax',
            'name' => 'Q1 Tax Season, Accounting & Fintech',
            'monthDay' => '03-20',
            'category' => 'Business',
            'region' => 'global',
            'leadDays' => 70,
            'demandScore' => 88,
            'competitionLevel' => 'Medium',
            'primaryQuery' => 'fintech tax audit workspace',
            'subNiches' => ['tax invoice calculator desk', 'small business bookkeeping', 'ai financial analytics dashboard', 'isometric banking vector'],
            'aiNote' => 'Corporate buyers prefer crisp studio desk compositions with legible tablet/laptop copy space.',
        ],
        [
            'slug' => 'earth-day-esg',
            'name' => 'Earth Day & Corporate ESG Sustainability',
            'monthDay' => '04-22',
            'category' => 'Seasonal',
            'region' => 'global',
            'leadDays' => 75,
            'demandScore' => 91,
            'competitionLevel' => 'Low',
            'primaryQuery' => 'sustainable packaging solar esg',
            'subNiches' => ['sustainable packaging mockup', 'solar wind clean energy 3d', 'zero waste glass bottle', 'green bond finance graph'],
            'aiNote' => 'Low saturation on modern B2B ESG illustrations, biodegradable material macros, and clean energy infrastructure.',
        ],
        [
            'slug' => 'eid-al-adha',
            'name' => 'Eid al-Adha & Summer Festive Travel',
            'monthDay' => '05-27',
            'category' => 'Holidays',
            'region' => 'global',
            'leadDays' => 80,
            'demandScore' => 87,
            'competitionLevel' => 'Low',
            'primaryQuery' => 'eid al-adha minimalist banner',
            'subNiches' => ['eid mubarak calligraphy gold', 'family festive table overhead', 'crescent lantern minimalist', 'eid social media template'],
            'aiNote' => 'Under-served niche 60–90 days pre-event; clean vector templates and warm editorial photography dominate.',
        ],
        [
            'slug' => 'back-to-school',
            'name' => 'Back to School & EdTech AI Learning',
            'monthDay' => '08-25',
            'category' => 'Business',
            'region' => 'global',
            'leadDays' => 80,
            'demandScore' => 93,
            'competitionLevel' => 'High',
            'primaryQuery' => 'edtech stem classroom notebook',
            'subNiches' => ['university student laptop cafe', '3d school icons pack', 'ai tutor interactive study', 'colorful stationery flat lay'],
            'aiNote' => 'High demand for authentic diverse student scenes and bright 3D education icon sets.',
        ],
        [
            'slug' => 'autumn-harvest',
            'name' => 'Autumn Aesthetic & Cozy Retail',
            'monthDay' => '09-22',
            'category' => 'Seasonal',
            'region' => 'western',
            'leadDays' => 75,
            'demandScore' => 86,
            'competitionLevel' => 'Medium',
            'primaryQuery' => 'autumn cozy coffee maple',
            'subNiches' => ['pumpkin spice ceramic mug', 'fall knitwear fashion neutral', 'autumn foliage aerial road', 'harvest farmers market'],
            'aiNote' => 'Soft muted amber palettes and minimalist café mood scenes outperform saturated orange cliches.',
        ],
        [
            'slug' => 'halloween-october',
            'name' => 'Halloween & Spooky Design Templates',
            'monthDay' => '10-31',
            'category' => 'Holidays',
            'region' => 'western',
            'leadDays' => 80,
            'demandScore' => 90,
            'competitionLevel' => 'High',
            'primaryQuery' => 'halloween minimalist 3d pumpkin',
            'subNiches' => ['cute pastel halloween vector', 'gothic poster template', 'candlelit autumn table', 'neon party flyer mockup'],
            'aiNote' => 'Pastel/minimalist 3D pumpkins and clean editable party flyer templates capture lower-competition queries.',
        ],
        [
            'slug' => 'black-friday-cyber',
            'name' => 'Black Friday & Cyber Monday Retail',
            'monthDay' => '11-26',
            'category' => 'Business',
            'region' => 'global',
            'leadDays' => 75,
            'demandScore' => 97,
            'competitionLevel' => 'High',
            'primaryQuery' => 'black friday 3d sale podium',
            'subNiches' => ['black gold shopping bag 3d', 'ecommerce flash sale banner', 'cyber monday neon typography', 'minimalist gift box dark'],
            'aiNote' => 'Peak annual commercial CPM; focus on matte black/gold 3D product podiums with blank banner copy space.',
        ],
        [
            'slug' => 'christmas-q4',
            'name' => 'Christmas, Winter Holidays & Q4 Wrap',
            'monthDay' => '12-25',
            'category' => 'Holidays',
            'region' => 'global',
            'leadDays' => 85,
            'demandScore' => 98,
            'competitionLevel' => 'High',
            'primaryQuery' => 'scandinavian minimalist christmas aesthetic',
            'subNiches' => ['nordic pine gift wrapping', 'warm fireplace cozy bokeh', 'winter holiday packaging mockup', 'festive sparkle background'],
            'aiNote' => 'Scandinavian minimalist interiors and neutral kraft-paper holiday packaging sell steadily with lower noise.',
        ],
    ];

    public function __construct(private readonly Cache $cache)
    {
    }

    /**
     * Build dynamic upcoming seasonal upload windows sorted chronologically from today.
     *
     * @return array<string, mixed>
     */
    public function getCalendar(int $daysAhead = 180, string $category = 'all'): array
    {
        $boundedDays = max(30, min(365, $daysAhead));
        $normalizedCategory = strtolower(trim($category)) ?: 'all';
        $todayKey = gmdate('Y-m-d');

        $cacheKey = sprintf('seasonal_calendar:%s:%d:%s', $todayKey, $boundedDays, $normalizedCategory);
        $cached = $this->cache->get($cacheKey);
        if (is_array($cached)) {
            $cached['cached'] = true;
            return $cached;
        }

        $now = strtotime($todayKey . ' 00:00:00 UTC') ?: time();
        $currentYear = (int) gmdate('Y', $now);
        $events = [];

        foreach (self::ANNUAL_EVENTS as $raw) {
            if ($normalizedCategory !== 'all' && strtolower($raw['category']) !== $normalizedCategory) {
                continue;
            }

            $eventTs = strtotime("{$currentYear}-{$raw['monthDay']} 00:00:00 UTC");
            if ($eventTs === false) {
                continue;
            }
            if ($eventTs < $now - (7 * 86400)) {
                $eventTs = strtotime(($currentYear + 1) . "-{$raw['monthDay']} 00:00:00 UTC") ?: $eventTs;
            }

            $daysUntil = (int) round(($eventTs - $now) / 86400);
            if ($daysUntil > $boundedDays) {
                continue;
            }

            $leadDays = (int) $raw['leadDays'];
            $uploadStartTs = $eventTs - ($leadDays * 86400);
            $daysToWindow = (int) round(($uploadStartTs - $now) / 86400);

            $urgency = match (true) {
                $daysUntil <= 21 => 'Late Window (Focus Fast Vectors/Templates)',
                $daysUntil <= 90 && $daysToWindow <= 14 => 'Peak Upload Window (Upload Now)',
                $daysToWindow <= 30 => 'Prepare Production Soon',
                default => 'Upcoming Horizon',
            };

            $events[] = [
                'slug' => $raw['slug'],
                'name' => $raw['name'],
                'category' => $raw['category'],
                'region' => $raw['region'],
                'eventDate' => gmdate('Y-m-d', $eventTs),
                'daysUntilEvent' => max(0, $daysUntil),
                'uploadWindowStart' => gmdate('Y-m-d', $uploadStartTs),
                'leadDays' => $leadDays,
                'urgency' => $urgency,
                'isPrimeWindow' => $daysUntil <= 90 && $daysUntil > 21,
                'demandScore' => $raw['demandScore'],
                'competitionLevel' => $raw['competitionLevel'],
                'primaryQuery' => $raw['primaryQuery'],
                'subNiches' => $raw['subNiches'],
                'aiNote' => $raw['aiNote'],
            ];
        }

        usort($events, static fn(array $a, array $b): int => $a['daysUntilEvent'] <=> $b['daysUntilEvent']);

        $primeCount = count(array_filter($events, static fn(array $e): bool => (bool) $e['isPrimeWindow']));
        $topOpportunity = null;
        foreach ($events as $evt) {
            if ($topOpportunity === null || $evt['demandScore'] > $topOpportunity['demandScore']) {
                $topOpportunity = $evt;
            }
        }

        $payload = [
            'success' => true,
            'cached' => false,
            'referenceDate' => $todayKey,
            'daysAhead' => $boundedDays,
            'category' => $normalizedCategory,
            'totalEvents' => count($events),
            'primeWindowCount' => $primeCount,
            'topEvent' => $topOpportunity ? $topOpportunity['name'] : 'None in window',
            'events' => $events,
        ];

        $this->cache->set($cacheKey, $payload, self::CACHE_TTL_SECONDS);
        return $payload;
    }
}
