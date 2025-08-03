<?php
header('Access-Control-Allow-Origin: *');
$url = 'https://blockchain.info' . $_GET['endpoint'];
echo file_get_contents($url);
?>
