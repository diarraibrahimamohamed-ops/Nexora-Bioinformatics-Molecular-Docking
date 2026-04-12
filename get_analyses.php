<?php
// Configuration de la base de données
$host = 'localhost';
$dbname = 'nexora_db';
$username = 'root';
$password = '';

// Utiliser le socket XAMPP comme dans config.php
$socket = '/opt/lampp/var/mysql/mysql.sock';

try {
    if (file_exists($socket)) {
        $pdo = new PDO("mysql:unix_socket=$socket;dbname=$dbname;charset=utf8mb4", $username, $password);
    } else {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupération des paramètres
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    
    // Construction de la requête
    $sql = "SELECT id, name, type, data, fasta_file, created_at, updated_at 
            FROM analyses WHERE 1=1";
    
    $params = [];
    
    // Filtre par recherche
    if (!empty($search)) {
        $sql .= " AND (name LIKE :search OR type LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    // Filtre par type
    if ($filter !== 'all') {
        $typeMap = [
            'dna' => 'dna_analysis',
            'protein' => 'protein_analysis',
            'resistance' => 'resistance_profile'
        ];
        if (isset($typeMap[$filter])) {
            $sql .= " AND type = :type";
            $params[':type'] = $typeMap[$filter];
        }
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $analyses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décodage du JSON data
    foreach ($analyses as &$analysis) {
        if ($analysis['data']) {
            $analysis['data'] = json_decode($analysis['data'], true);
        }
    }
    
    // Filtrer spécifiquement pour le docking: analyses avec séquence protéique
    $protein_analyses = [];
    $seen_ids = []; // Pour éviter les doublons
    
    foreach ($analyses as $analysis) {
        if ($analysis['data'] && isset($analysis['data']['protein_data']['sequence'])) {
            // Éviter les doublons basés sur l'ID
            if (!in_array($analysis['id'], $seen_ids)) {
                $protein_analyses[] = $analysis;
                $seen_ids[] = $analysis['id'];
            }
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $protein_analyses, // Garder la compatibilité avec 'data'
        'analyses' => $protein_analyses, // Ajouter 'analyses' pour le docking
        'total' => count($protein_analyses)
    ]);
    
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
