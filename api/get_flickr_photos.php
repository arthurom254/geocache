<?php
header('Content-Type: application/json');

$apiKey = '15dec9217c7b77cf3fd99a989cd43f12';

if (!isset($_GET['bbox'])) {
    echo json_encode(['error' => 'Missing required parameter: bbox']);
    exit();
}

$bbox = $_GET['bbox'];

$flickrUrl = 'https://api.flickr.com/services/rest/';
$params = [
    'method' => 'flickr.photos.search',
    'api_key' => $apiKey,
    'bbox' => $bbox,
    'accuracy' => 16, 
    'safe_search' => 1, 
    'content_type' => 1, 
    'media' => 'photos',
    'per_page' => 20, 
    'format' => 'json',
    'nojsoncallback' => 1
];

$url = $flickrUrl . '?' . http_build_query($params);

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
    curl_close($ch);
    exit();
}

curl_close($ch);

echo $response;
?>