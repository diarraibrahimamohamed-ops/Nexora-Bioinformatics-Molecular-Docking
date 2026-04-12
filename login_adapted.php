<?php
/**
 * Système d'authentification sécurisé pour Nexora
 * Utilise JWT et protection contre les attaques courantes
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
$securityConfig = $config['security'];

// Protection contre les attaques par déni de service
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Vérification du Content-Type
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Content-Type doit être application/json']);
    exit;
}

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
 * Validation et traitement sécurisé des données de connexion
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function generateJWT($userId, $secret, $lifetime = 3600) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'iat' => time(),
        'exp' => time() + $lifetime
    ]);

    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $secret, true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

// Lire et valider les données JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON invalide']);
    exit;
}

$identifier = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Champs manquants']);
    exit;
}

// Validation de l'identifiant (email ou username)
if (strpos($identifier, '@') !== false && !validateEmail($identifier)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format d\'email invalide']);
    exit;
}

// Protection contre les attaques par dictionnaire (rate limiting)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$attemptKey = "login_attempts:{$ip}";

try {
    // Vérifier les tentatives récentes (implémentation simplifiée)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as attempts
        FROM login_attempts
        WHERE ip_address = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    ");
    $stmt->execute([$ip]);
    $attempts = $stmt->fetch()['attempts'] ?? 0;

    if ($attempts >= $securityConfig['max_login_attempts']) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Trop de tentatives. Réessayez dans 15 minutes.']);
        exit;
    }

    // Recherche de l'utilisateur
    $stmt = $pdo->prepare("
        SELECT id, username, email, password, status
        FROM users
        WHERE (email = ? OR username = ?) AND status = 'active'
    ");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        // Enregistrer la tentative échouée
        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (ip_address, identifier, attempted_at)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$ip, $identifier]);

        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
        exit;
    }

    // Générer le JWT
    $token = generateJWT($user['id'], $securityConfig['jwt_secret'], $securityConfig['session_lifetime']);

    // Mettre à jour la dernière connexion
    $stmt = $pdo->prepare("
        UPDATE users
        SET last_login = NOW(), token = ?
        WHERE id = ?
    ");
    $stmt->execute([$token, $user['id']]);

    // Nettoyer les anciennes tentatives réussies
    $stmt = $pdo->prepare("DELETE FROM login_attempts WHERE ip_address = ?");
    $stmt->execute([$ip]);

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email']
        ],
        'expires_in' => $securityConfig['session_lifetime'],
        'redirect' => '/index.html'
    ]);

} catch (Exception $e) {
    error_log('Erreur login: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}

?>
