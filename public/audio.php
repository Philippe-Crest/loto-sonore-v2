<?php
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function send_error(int $status, string $code, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    $payload = json_encode(['error' => ['code' => $code, 'message' => $message]], JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        $payload = '{"error":{"code":"encoding_error","message":"Erreur interne d\'encodage JSON."}}';
    }
    echo $payload;
    exit;
}

$id = trim((string)($_GET['id'] ?? ''));
if ($id === '') {
    send_error(400, 'invalid_request', 'Paramètre id manquant ou invalide.');
}

$cataloguePath = dirname(__DIR__) . '/data/catalogue.json';
if (!is_file($cataloguePath)) {
    send_error(500, 'catalogue_error', 'Catalogue manquant.');
}

$raw = file_get_contents($cataloguePath);
if ($raw === false) {
    send_error(500, 'catalogue_error', 'Lecture du catalogue impossible.');
}

$catalogue = json_decode($raw, true);
if (!is_array($catalogue)) {
    send_error(500, 'catalogue_error', 'Catalogue JSON invalide.');
}

$fileRelative = null;
foreach ($catalogue['modes'] ?? [] as $mode) {
    foreach ($mode['sounds'] ?? [] as $sound) {
        if (($sound['id'] ?? null) === $id) {
            $fileRelative = (string)($sound['file'] ?? '');
            break 2;
        }
    }
}

if ($fileRelative === null || $fileRelative === '') {
    send_error(404, 'not_found', "Son introuvable pour l'id fourni.");
}

if (str_contains($fileRelative, '..') || str_starts_with($fileRelative, '/') || str_contains($fileRelative, '\\')) {
    send_error(404, 'not_found', "Fichier audio introuvable.");
}

$audioRoot = realpath(dirname(__DIR__) . '/storage/audio');
if ($audioRoot === false) {
    send_error(500, 'audio_error', 'Erreur interne lors de la lecture audio.');
}

$targetPath = $audioRoot . '/' . $fileRelative;
$realTarget = realpath($targetPath);
if ($realTarget === false || !str_starts_with($realTarget, $audioRoot . DIRECTORY_SEPARATOR)) {
    send_error(404, 'not_found', "Fichier audio introuvable.");
}

if (!is_file($realTarget) || !is_readable($realTarget)) {
    send_error(404, 'not_found', "Fichier audio introuvable.");
}

$fileSize = filesize($realTarget);
if ($fileSize === false) {
    send_error(500, 'audio_error', 'Erreur interne lors de la lecture audio.');
}

$start = 0;
$end = $fileSize - 1;
$status = 200;

$range = $_SERVER['HTTP_RANGE'] ?? '';
if ($range !== '') {
    if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $matches)) {
        header("Content-Range: bytes */{$fileSize}");
        send_error(416, 'range_invalid', 'Range invalide.');
    }

    $startStr = $matches[1];
    $endStr = $matches[2];

    if ($startStr === '' && $endStr === '') {
        header("Content-Range: bytes */{$fileSize}");
        send_error(416, 'range_invalid', 'Range invalide.');
    }

    $isSuffix = false;
    if ($startStr === '') {
        $suffixLength = (int)$endStr;
        if ($suffixLength <= 0) {
            header("Content-Range: bytes */{$fileSize}");
            send_error(416, 'range_invalid', 'Range invalide.');
        }
        $start = max(0, $fileSize - $suffixLength);
        $end = $fileSize - 1;
        $isSuffix = true;
    } else {
        $start = (int)$startStr;
    }

    if ($endStr !== '' && !$isSuffix) {
        $end = (int)$endStr;
    }

    if ($start < 0 || $end < 0 || $start > $end || $start >= $fileSize) {
        header("Content-Range: bytes */{$fileSize}");
        send_error(416, 'range_invalid', 'Range invalide.');
    }

    if ($end >= $fileSize) {
        $end = $fileSize - 1;
    }

    $status = 206;
}

$length = $end - $start + 1;

http_response_code($status);
header('Content-Type: audio/mpeg');
header('Accept-Ranges: bytes');
header('X-Content-Type-Options: nosniff');
header('Content-Length: ' . $length);
if ($status === 206) {
    header("Content-Range: bytes {$start}-{$end}/{$fileSize}");
}

if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
if (function_exists('ini_set')) {
    @ini_set('zlib.output_compression', '0');
    @ini_set('output_buffering', '0');
}
while (ob_get_level() > 0) {
    @ob_end_clean();
}

$handle = fopen($realTarget, 'rb');
if ($handle === false) {
    send_error(500, 'audio_error', 'Erreur interne lors de la lecture audio.');
}

if (fseek($handle, $start) !== 0) {
    fclose($handle);
    send_error(500, 'audio_error', 'Erreur interne lors de la lecture audio.');
}

$chunkSize = 131072;
$bytesLeft = $length;

while ($bytesLeft > 0 && !feof($handle)) {
    $readLength = $bytesLeft > $chunkSize ? $chunkSize : $bytesLeft;
    $buffer = fread($handle, $readLength);
    if ($buffer === false) {
        fclose($handle);
        send_error(500, 'audio_error', 'Erreur interne lors de la lecture audio.');
    }
    echo $buffer;
    $bytesLeft -= strlen($buffer);
    if (function_exists('flush')) {
        flush();
    }
}

fclose($handle);
