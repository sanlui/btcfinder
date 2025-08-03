<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Verifica che 'endpoint' sia presente
if (!isset($_GET['endpoint'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing endpoint"]);
    exit;
}

$endpoint = $_GET['endpoint'];
$base_url = "https://blockchain.info";

// Prepara URL finale
$url = $base_url . $endpoint;

// Inizializza cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'PHP Proxy');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "cURL error: " . curl_error($ch)]);
} elseif ($http_code !== 200) {
    http_response_code($http_code);
    echo json_encode(["error" => "HTTP $http_code from blockchain.info"]);
} else {
    echo $response;
}

curl_close($ch);
?>
