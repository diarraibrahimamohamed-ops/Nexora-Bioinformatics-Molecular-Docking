<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbname = 'nexora_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Total des analyses
    $totalStmt = $pdo->query("SELECT COUNT(*) as total FROM analyses");
    $total = $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Analyses par type (pour le graphique)
    $typeStmt = $pdo->query("
        SELECT type, COUNT(*) as count, 
               DATE_FORMAT(created_at, '%Y-%m') as month
        FROM analyses 
        GROUP BY type, month 
        ORDER BY month DESC 
        LIMIT 12
    ");
    $typeData = $typeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Analyses par type (global)
    $globalTypeStmt = $pdo->query("
        SELECT type, COUNT(*) as count
        FROM analyses 
        GROUP BY type
    ");
    $globalTypeData = $globalTypeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'total' => $total,
        'successRate' => 95, // À calculer selon votre logique
        'avgProcessingTime' => 3.2, // À calculer selon votre logique
        'typeData' => $typeData,
        'globalTypeData' => $globalTypeData
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
