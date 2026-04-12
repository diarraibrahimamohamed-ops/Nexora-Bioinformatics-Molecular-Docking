<?php
/**
 * Configuration centralisée de Nexora
 * Utilise le système d'environnement sécurisé
 */

require_once __DIR__ . '/env.php';

return [
    'db' => [
        'host' => Environment::get('DB_HOST', 'localhost'), // XAMPP
        'port' => (int)Environment::get('DB_PORT', 3306),
        'socket' => Environment::get('DB_SOCKET', '/opt/lampp/var/mysql/mysql.sock'), // Socket XAMPP
        'dbname' => Environment::get('DB_NAME', 'nexora_db'),
        'user' => Environment::get('DB_USER', 'root'), // XAMPP root
        'pass' => Environment::get('DB_PASS', '') // XAMPP root sans mot de passe
    ],
    'api_keys' => [
        'ncbi' => Environment::get('NCBI_API_KEY', ''),
        'huggingface' => Environment::get('HUGGINGFACE_API_KEY', '')
    ],
    'app' => [
        'env' => Environment::get('APP_ENV', 'production'),
        'debug' => Environment::get('APP_DEBUG', 'false') === 'true',
        'upload_dir' => Environment::get('UPLOAD_DIR', __DIR__ . '/uploads'),
        'max_file_size' => (int)Environment::get('MAX_FILE_SIZE', 10485760)
    ],
    'security' => [
        'jwt_secret' => Environment::get('JWT_SECRET', 'CHANGE_THIS_JWT_SECRET'),
        'session_lifetime' => (int)Environment::get('SESSION_LIFETIME', 3600),
        'max_login_attempts' => (int)Environment::get('MAX_LOGIN_ATTEMPTS', 5)
    ],
    'cache' => [
        'redis_host' => Environment::get('REDIS_HOST', 'localhost'),
        'redis_port' => (int)Environment::get('REDIS_PORT', 6379),
        'ttl' => (int)Environment::get('CACHE_TTL', 3600)
    ]
];
