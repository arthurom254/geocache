<?php
$host = 'localhost'; // 150.135.53.5
$dbname = 'test';
$username = 'root'; 
$password = ''; 
$port = 3306;

try {
    $db = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
?>