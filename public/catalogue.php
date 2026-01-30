<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$path = dirname(__DIR__) . '/data/catalogue.json';

if (!is_file($path)) {
    http_response_code(500);
    echo json_encode(['error' => 'Catalogue manquant.']);
    exit;
}

$raw = file_get_contents($path);
if ($raw === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Lecture du catalogue impossible.']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Catalogue JSON invalide.']);
    exit;
}

$encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($encoded === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Encodage JSON impossible.']);
    exit;
}

echo $encoded;
