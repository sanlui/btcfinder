<?php
// Abilita CORS per tutti i domini (puoi limitarlo se vuoi)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Verifica che il parametro sia presente
if (!isset($_GET['wallet'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing wallet address"]);
    exit;
}

// Sanifica input
$wallet = preg_replace('/[^a-zA-Z0-9]/', '', $_GET['wallet']);
$url = "https://blockchain.info/rawaddr/$wallet?limit=50";

// Inizializza cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'PHP Proxy'); // importante per evitare 429
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
