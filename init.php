<?php
/**
 * Script d'initialisation de Nexora
 * Configure la base de données et les permissions
 */

require_once __DIR__ . '/ErrorHandler.php';
require_once __DIR__ . '/env.php';

echo " Initialisation de Nexora v2.0\n";
echo "================================\n\n";

// Chargement de la configuration
$config = require __DIR__ . '/config.php';
ErrorHandler::init($config);

$dbcfg = $config['db'];
$appConfig = $config['app'];

echo "1. Vérification de l'environnement...\n";

// Vérifier les extensions PHP requises
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'openssl'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

if (!empty($missingExtensions)) {
    echo " Extensions PHP manquantes: " . implode(', ', $missingExtensions) . "\n";
    echo "Installez-les avec: sudo apt-get install php-" . implode(' php-', $missingExtensions) . "\n";
    exit(1);
}
echo " Extensions PHP OK\n";

// Vérifier les permissions des dossiers
$directories = [
    __DIR__ . '/cache' => 0755,
    __DIR__ . '/logs' => 0755,
    __DIR__ . '/uploads' => 0755,
    __DIR__ . '/ncbi_sequences' => 0755
];

foreach ($directories as $dir => $perms) {
    if (!is_dir($dir)) {
        mkdir($dir, $perms, true);
        echo " Création du dossier: $dir\n";
    }

    if (!is_writable($dir)) {
        chmod($dir, $perms);
        echo " Permissions ajustées: $dir\n";
    }
}
echo " Permissions des dossiers OK\n";

echo "\n2. Configuration de la base de données...\n";

// Tester la connexion à la base de données
try {
    $pdo = new PDO(
        "mysql:host={$dbcfg['host']};port={$dbcfg['port']};charset=utf8mb4",
        $dbcfg['user'],
        $dbcfg['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    echo " Connexion BDD OK\n";

    // Vérifier si la base de données existe
    $stmt = $pdo->query("SHOW DATABASES LIKE '{$dbcfg['dbname']}'");
    if (!$stmt->fetch()) {
        echo " Création de la base de données: {$dbcfg['dbname']}\n";
        $pdo->exec("CREATE DATABASE `{$dbcfg['dbname']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Sélectionner la base
        $pdo->exec("USE `{$dbcfg['dbname']}`");
    } else {
        $pdo->exec("USE `{$dbcfg['dbname']}`");
        echo " Base de données existante détectée\n";
    }

    // Charger et exécuter le schéma
    echo " Application du schéma de base de données...\n";
    $schema = file_get_contents(__DIR__ . '/database_schema.sql');

    // Diviser le schéma en statements individuels
    $statements = array_filter(array_map('trim', explode(';', $schema)));

    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^(SET|DELIMITER|CREATE EVENT|ANALYZE|--)/i', $statement)) {
            try {
                $pdo->exec($statement);
            } catch (Exception $e) {
                // Ignorer les erreurs de tables déjà existantes
                if (!preg_match('/already exists|duplicate/i', $e->getMessage())) {
                    echo "  Erreur SQL: " . $e->getMessage() . "\n";
                }
            }
        }
    }

    echo " Schéma appliqué\n";

    // Vérifier les tables créées
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo " Tables créées: " . count($tables) . "\n";

} catch (Exception $e) {
    echo " Erreur de base de données: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n3. Configuration des clés API...\n";

// Vérifier les clés API
$apiKeys = $config['api_keys'];
if (empty($apiKeys['ncbi'])) {
    echo "  Clé NCBI API manquante dans .env\n";
} else {
    echo " Clé NCBI API configurée\n";
}

if (empty($apiKeys['huggingface'])) {
    echo "  Clé HuggingFace API manquante dans .env\n";
} else {
    echo " Clé HuggingFace API configurée\n";
}

echo "\n4. Tests finaux...\n";

// Tester l'API
$apiTest = @file_get_contents('http://localhost' . ($_SERVER['SERVER_PORT'] ?? ':80') . '/api.php?action=test');
if ($apiTest) {
    $response = json_decode($apiTest, true);
    if ($response && $response['success']) {
        echo " API fonctionnelle\n";
    } else {
        echo "  API répond mais retourne une erreur\n";
    }
} else {
    echo "  API non accessible (normal si serveur non démarré)\n";
}

echo "\n Initialisation terminée avec succès !\n\n";

echo "Prochaines étapes:\n";
echo "1. Configurez votre serveur web (Apache/Nginx)\n";
echo "2. Pointez la racine vers: " . __DIR__ . "\n";
echo "3. Accédez à: http://votre-domaine/index.html\n";
echo "4. Premier utilisateur: admin@nexora.test / test123!\n\n";

echo "Documentation: consultez README.md pour plus d'informations\n";
?>