<?php
/**
 * Système d'inscription sécurisé pour Nexora
 * Validation robuste et protection contre les attaques
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Initialisation du système d'erreurs
require_once __DIR__ . '/ErrorHandler.php';

// Chargement sécurisé de la configuration
$config = require __DIR__ . '/config.php';
ErrorHandler::init($config);
$dbcfg = $config['db'];

try {
    // Utiliser le socket XAMPP si disponible
    $dsn = "mysql:unix_socket={$dbcfg['socket']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    if (empty($dbcfg['socket'])) {
        $dsn = "mysql:host={$dbcfg['host']};port={$dbcfg['port']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    }

    $pdo = new PDO($dsn, $dbcfg['user'], $dbcfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Exception $e) {
    error_log('Erreur connexion BDD: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}

/**
 * Fonctions de validation sécurisée
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validateUsername($username) {
    // 3-20 caractères, lettres, chiffres, underscore uniquement
    return preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username);
}

function validatePassword($password) {
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
    return strlen($password) >= 8 &&
           preg_match('/[A-Z]/', $password) &&
           preg_match('/[a-z]/', $password) &&
           preg_match('/[0-9]/', $password);
}

// Lire et valider les données JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON invalide']);
    exit;
}

$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validation des champs requis
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tous les champs sont requis']);
    exit;
}

// Validation du format des données
if (!validateUsername($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur invalide (3-20 caractères, lettres/chiffres/underscore uniquement)']);
    exit;
}

if (!validateEmail($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format d\'email invalide']);
    exit;
}

if (!validatePassword($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Mot de passe trop faible (8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre requis)']);
    exit;
}

try {
    // Vérifier si email ou username existe déjà
    $stmt = $pdo->prepare("
        SELECT id FROM users
        WHERE email = ? OR username = ?
    ");
    $stmt->execute([$email, $username]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email ou nom d\'utilisateur déjà utilisé']);
        exit;
    }

    // Hash sécurisé du mot de passe (compatible avec toutes les versions PHP)
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Insertion sécurisée
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password, status, created_at)
        VALUES (?, ?, ?, 'active', NOW())
    ");

    if ($stmt->execute([$username, $email, $hash])) {
        $userId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Compte créé avec succès',
            'user_id' => $userId
        ]);
    } else {
        throw new Exception('Échec de l\'insertion');
    }

} catch (Exception $e) {
    error_log('Erreur inscription: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>