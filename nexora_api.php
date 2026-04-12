<?php
/**
 * API REST pour le simulateur quantique NEXORA
 * Retourne les données de la dernière analyse
 */

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// Inclure votre fichier d'analyse principal
// require_once 'votre_fichier_analyse.php';

// OU directement depuis la base de données:
try {
    // Connexion via socket XAMPP
    $pdo = new PDO('mysql:unix_socket=/opt/lampp/var/mysql/mysql.sock;dbname=nexora_db;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupérer la dernière analyse
    $stmt = $pdo->query("SELECT * FROM analyses ORDER BY id DESC LIMIT 1");
    $analysis = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$analysis) {
        echo json_encode([
            'success' => false,
            'error' => 'Aucune analyse trouvée'
        ]);
        exit;
    }
    
    // Décoder le JSON de la colonne 'data'
    $analysisData = json_decode($analysis['data'], true);
    
    // Construire la réponse complète
    $response = [
        'success' => true,
        'analysis_id' => $analysis['id'],
        'sequence_info' => [
            'length' => strlen($analysisData['original_sequence'] ?? ''),
            'has_reference' => isset($analysisData['reference_sequence'])
        ],
        'metrics' => [
            'gc_content' => $analysisData['metrics']['gc_content'] ?? 50,
            'entropy' => $analysisData['metrics']['entropy'] ?? 1.5,
            'at_skew' => $analysisData['metrics']['at_skew'] ?? 0
        ],
        'original_sequence' => $analysisData['original_sequence'] ?? '',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
