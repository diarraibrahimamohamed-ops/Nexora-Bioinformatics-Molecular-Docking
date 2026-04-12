<?php
// Script pour vérifier les données NULL dans docking_results
require_once 'config.php';

// Connexion PDO directe
$config = require __DIR__ . '/config.php';
$dbConfig = $config['db'];

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4;unix_socket={$dbConfig['socket']}",
        $dbConfig['user'],
        $dbConfig['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}

echo "<h2>Vérification des données NULL dans docking_results</h2>";

// Récupérer les derniers enregistrements
$stmt = $pdo->query("SELECT id, docking_score, binding_energy, pose_data, receptor_file, ligand_file, vina_log, modeling_method FROM docking_results ORDER BY id DESC LIMIT 10");

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr style='background: #f0f0f0;'>";
echo "<th>ID</th>";
echo "<th>Docking Score</th>";
echo "<th>Binding Energy</th>";
echo "<th>Pose Data</th>";
echo "<th>Receptor File</th>";
echo "<th>Ligand File</th>";
echo "<th>Vina Log</th>";
echo "<th>Modeling Method</th>";
echo "</tr>";

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . ($row['docking_score'] ?? 'NULL') . "</td>";
    echo "<td>" . ($row['binding_energy'] ?? 'NULL') . "</td>";
    
    // Vérifier pose_data
    $pose_data = $row['pose_data'];
    if ($pose_data) {
        $decoded = json_decode($pose_data, true);
        if ($decoded && isset($decoded['poses'])) {
            echo "<td>" . count($decoded['poses']) . " poses</td>";
        } else {
            echo "<td>Format inconnu</td>";
        }
    } else {
        echo "<td style='color: red;'>NULL</td>";
    }
    
    echo "<td>" . ($row['receptor_file'] ?? 'NULL') . "</td>";
    echo "<td>" . ($row['ligand_file'] ?? 'NULL') . "</td>";
    
    // Vérifier vina_log
    $vina_log = $row['vina_log'];
    if ($vina_log) {
        if (strlen($vina_log) > 100) {
            echo "<td>" . substr($vina_log, 0, 100) . "...</td>";
        } else {
            echo "<td>" . htmlspecialchars($vina_log) . "</td>";
        }
    } else {
        echo "<td style='color: red;'>NULL</td>";
    }
    
    echo "<td>" . ($row['modeling_method'] ?? 'NULL') . "</td>";
    echo "</tr>";
}

echo "</table>";

// Vérifier les entrées avec des NULL critiques
echo "<h3>Entrées avec des NULL critiques:</h3>";

$stmt_nulls = $pdo->query("
    SELECT id, status, 
           CASE WHEN docking_score IS NULL THEN 'docking_score' END as missing_score,
           CASE WHEN binding_energy IS NULL THEN 'binding_energy' END as missing_energy,
           CASE WHEN pose_data IS NULL THEN 'pose_data' END as missing_pose,
           CASE WHEN vina_log IS NULL THEN 'vina_log' END as missing_log
    FROM docking_results 
    WHERE docking_score IS NULL 
       OR binding_energy IS NULL 
       OR pose_data IS NULL 
       OR vina_log IS NULL
    ORDER BY id DESC 
    LIMIT 5
");

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr style='background: #ffe0e0;'>";
echo "<th>ID</th>";
echo "<th>Status</th>";
echo "<th>Champs manquants</th>";
echo "</tr>";

while ($row = $stmt_nulls->fetch(PDO::FETCH_ASSOC)) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . $row['status'] . "</td>";
    $missing = array_filter([$row['missing_score'], $row['missing_energy'], $row['missing_pose'], $row['missing_log']]);
    echo "<td style='color: red;'>" . implode(', ', $missing) . "</td>";
    echo "</tr>";
}

echo "</table>";
?>
