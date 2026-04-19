<?php
/**
 * Configuration d'environnement pour XAMPP sur Ubuntu
 * Mot de passe vide pour l'utilisateur root
 */

class Environment {
    private static $loaded = false;
    private static $env = [
        // Configuration XAMPP par défaut (socket Unix)
        'DB_HOST' => 'localhost',
        'DB_PORT' => '3306',
        'DB_SOCKET' => '/opt/lampp/var/mysql/mysql.sock',
        'DB_NAME' => 'nexora_db',
        'DB_USER' => 'root',
        'DB_PASS' => '', // XAMPP root sans mot de passe

        // Clés API (valeurs de test)
        'NCBI_API_KEY' => '',
        'HUGGINGFACE_API_KEY' => '',

        // Configuration application
        'APP_ENV' => 'development',
        'APP_DEBUG' => 'true',
        'UPLOAD_DIR' => __DIR__ . '/uploads',
        'MAX_FILE_SIZE' => '10485760',

        // Sécurité
        'JWT_SECRET' => 'nexora_dev_secret_key_2024_change_in_production',
        'SESSION_LIFETIME' => '3600',
        'MAX_LOGIN_ATTEMPTS' => '5',

        // Cache
        'REDIS_HOST' => 'localhost',
        'REDIS_PORT' => '6379',
        'CACHE_TTL' => '3600'
    ];

    public static function load() {
        if (self::$loaded) return;

        // Charger depuis .env si disponible
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($key, $value) = explode('=', $line, 2);
                self::$env[trim($key)] = trim($value);
            }
        }

        self::$loaded = true;
    }

    public static function get($key, $default = null) {
        self::load();
        return self::$env[$key] ?? $default ?? '';
    }

    public static function set($key, $value) {
        self::$env[$key] = $value;
    }

    public static function has($key) {
        self::load();
        return isset(self::$env[$key]);
    }
}

// Initialisation automatique
Environment::load();
?>