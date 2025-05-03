<?php
header('Content-Type: application/json');

require_once 'db_connection.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// validation
if (!isset($input['minLat']) || !isset($input['maxLat']) || !isset($input['minLng']) || !isset($input['maxLng'])) {
    echo json_encode(['error' => 'Missing required parameters']);
    exit();
}

try {
    $minLat = floatval($input['minLat']);
    $maxLat = floatval($input['maxLat']);
    $minLng = floatval($input['minLng']);
    $maxLng = floatval($input['maxLng']);
    
    // building query
    $query = "SELECT t.cache_id, t.latitude, t.longitude, c.cache_type, t.difficulty_rating 
              FROM test_data t
              JOIN cache_types c ON t.cache_type_id = c.type_id
              WHERE CAST(t.latitude AS DECIMAL(10,6)) BETWEEN :minLat AND :maxLat
              AND CAST(t.longitude AS DECIMAL(10,6)) BETWEEN :minLng AND :maxLng";
    
    // cache type filter
    if (isset($input['cacheType']) && $input['cacheType'] !== '0') {
        $query .= " AND t.cache_type_id = :cacheType";
    }
    
    // difficulty filter
    if (isset($input['difficulty']) && $input['difficulty'] !== '0') {
        $query .= " AND t.difficulty_rating = :difficulty";
    }
    
    // query statement
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':minLat', $minLat, PDO::PARAM_STR);
    $stmt->bindParam(':maxLat', $maxLat, PDO::PARAM_STR);
    $stmt->bindParam(':minLng', $minLng, PDO::PARAM_STR);
    $stmt->bindParam(':maxLng', $maxLng, PDO::PARAM_STR);
    
    if (isset($input['cacheType']) && $input['cacheType'] !== '0') {
        $cacheTypeInt = intval($input['cacheType']);
        $stmt->bindParam(':cacheType', $cacheTypeInt, PDO::PARAM_INT);
    }
    
    if (isset($input['difficulty']) && $input['difficulty'] !== '0') {
        $difficultyInt = intval($input['difficulty']);
        $stmt->bindParam(':difficulty', $difficultyInt, PDO::PARAM_INT);
    }
    
    //  query exec
    $stmt->execute();
    
    // Fetching geocaches
    $geocaches = $stmt->fetchAll();
    // Response as json
    echo json_encode($geocaches);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error searching geocaches: ' . $e->getMessage()]);
}
?>