<?php
header('Content-Type: application/json');

require_once 'db_connection.php';

try {
    // get all cache types
    $query = "SELECT * FROM cache_types ORDER BY type_id";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $cacheTypes = $stmt->fetchAll();
    
    echo json_encode($cacheTypes);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error fetching cache types: ' . $e->getMessage()]);
}
?>