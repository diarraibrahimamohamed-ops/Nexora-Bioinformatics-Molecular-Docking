<?php
/**
 * Script de vérification rapide de Nexora
 */

echo "🔍 Vérification de Nexora...\n\n";

try {
    // Test de connexion DB
    $pdo = new PDO('mysql:unix_socket=/opt/lampp/var/mysql/mysql.sock;dbname=nexora_db;charset=utf8mb4', 'root', '');
    echo " Base de données connectée\n";

    // Test des tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $requiredTables = ['users', 'analyses', 'sequences'];
    $missingTables = array_diff($requiredTables, $tables);

    if (empty($missingTables)) {
        echo " Tables créées\n";
    } else {
        echo " Tables manquantes: " . implode(', ', $missingTables) . "\n";
    }

    // Test des fichiers
    $files = [
        'env.php' => 'Configuration environnement',
        'config.php' => 'Configuration principale',
        'js/config.js' => 'Configuration JavaScript',
        'js/api.js' => 'Module API',
        'js/state.js' => 'Gestionnaire d\'état'
    ];

    foreach ($files as $file => $desc) {
        if (file_exists($file)) {
            echo " $desc\n";
        } else {
            echo " $desc manquant\n";
        }
    }

    echo "\n Nexora est prêt !\n";
    echo " Accédez à: http://localhost/nexora/\n";
    echo " Test: testuser / test123!\n";

} catch (Exception $e) {
    echo " Erreur: " . $e->getMessage() . "\n";
    echo "\n🔧 Solutions:\n";
    echo "1. Vérifiez que XAMPP est démarré\n";
    echo "2. Exécutez: sudo /opt/lampp/lampp start\n";
    echo "3. Redémarrez votre navigateur\n";
}
?>