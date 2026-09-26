<?php

function updateAuthorLevel(mysqli $mysqli, int $authorId): array
{
    $statsSql = "
        SELECT
            COUNT(c.id) AS published_files,
            COALESCE(SUM(c.downloads_count), 0) AS total_downloads
        FROM contents c
        WHERE c.author_id = ?
          AND c.status = 'published'
    ";

    $statsStmt = $mysqli->prepare($statsSql);
    $statsStmt->bind_param("i", $authorId);
    $statsStmt->execute();

    $stats = $statsStmt->get_result()->fetch_assoc();
    $statsStmt->close();

    $publishedFiles = (int) ($stats["published_files"] ?? 0);
    $totalDownloads = (int) ($stats["total_downloads"] ?? 0);

    $levelSql = "
        SELECT id, level_number, level_name
        FROM author_level_rules
        WHERE is_active = 1
          AND min_published_files <= ?
          AND min_total_downloads <= ?
        ORDER BY level_number DESC
        LIMIT 1
    ";

    $levelStmt = $mysqli->prepare($levelSql);
    $levelStmt->bind_param("ii", $publishedFiles, $totalDownloads);
    $levelStmt->execute();

    $newLevel = $levelStmt->get_result()->fetch_assoc();
    $levelStmt->close();

    if (!$newLevel) {
        $newLevel = [
            "id" => 0,
            "level_number" => 0,
            "level_name" => "New Contributor"
        ];
    }

    $authorSql = "
        SELECT level_id
        FROM authors
        WHERE id = ?
        LIMIT 1
    ";

    $authorStmt = $mysqli->prepare($authorSql);
    $authorStmt->bind_param("i", $authorId);
    $authorStmt->execute();

    $author = $authorStmt->get_result()->fetch_assoc();
    $authorStmt->close();

    $oldLevelId = (int) ($author["level_id"] ?? 0);
    $newLevelId = (int) $newLevel["id"];

    $updateSql = "
        UPDATE authors
        SET
            level_id = ?,
            total_published_files = ?,
            total_downloads = ?,
            level_updated_at = NOW()
        WHERE id = ?
    ";

    $updateStmt = $mysqli->prepare($updateSql);
    $updateStmt->bind_param(
        "iiii",
        $newLevelId,
        $publishedFiles,
        $totalDownloads,
        $authorId
    );
    $updateStmt->execute();
    $updateStmt->close();

    if ($oldLevelId !== $newLevelId) {
        $historySql = "
            INSERT INTO author_level_history (
                author_id,
                old_level_id,
                new_level_id,
                published_files_at_change,
                downloads_at_change,
                changed_reason
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ";

        $reason = "Automatic update from published files and downloads";

        $historyStmt = $mysqli->prepare($historySql);
        $historyStmt->bind_param(
            "iiiiis",
            $authorId,
            $oldLevelId,
            $newLevelId,
            $publishedFiles,
            $totalDownloads,
            $reason
        );
        $historyStmt->execute();
        $historyStmt->close();
    }

    return [
        "level_id" => $newLevelId,
        "level_number" => (int) $newLevel["level_number"],
        "level_name" => $newLevel["level_name"],
        "published_files" => $publishedFiles,
        "total_downloads" => $totalDownloads,
        "level_changed" => $oldLevelId !== $newLevelId
    ];
}