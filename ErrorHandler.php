<?php
/**
 * Gestionnaire d'erreurs unifié pour Nexora
 * Logging structuré et réponses d'erreur sécurisées
 */

class ErrorHandler {
    private static $logFile;
    private static $isDebug;

    public static function init($config) {
        self::$isDebug = $config['app']['debug'] ?? false;
        self::$logFile = __DIR__ . '/logs/errors.log';

        // Créer le répertoire de logs si nécessaire
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        // Définir les gestionnaires d'erreurs
        set_error_handler([__CLASS__, 'handleError']);
        set_exception_handler([__CLASS__, 'handleException']);
        register_shutdown_function([__CLASS__, 'handleShutdown']);
    }

    /**
     * Gestionnaire d'erreurs PHP
     */
    public static function handleError($errno, $errstr, $errfile, $errline) {
        $error = [
            'type' => 'error',
            'level' => $errno,
            'message' => $errstr,
            'file' => $errfile,
            'line' => $errline,
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];

        self::log($error);

        // Ne pas afficher les erreurs en production
        if (!self::$isDebug) {
            return true;
        }

        return false;
    }

    /**
     * Gestionnaire d'exceptions non capturées
     */
    public static function handleException($exception) {
        $error = [
            'type' => 'exception',
            'class' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request' => [
                'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]
        ];

        self::log($error);

        // Réponse d'erreur sécurisée
        http_response_code(500);
        if (self::$isDebug) {
            echo json_encode([
                'success' => false,
                'error' => 'Erreur serveur',
                'debug' => [
                    'message' => $exception->getMessage(),
                    'file' => basename($exception->getFile()),
                    'line' => $exception->getLine()
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Erreur serveur interne'
            ]);
        }

        exit;
    }

    /**
     * Gestionnaire d'arrêt fatal
     */
    public static function handleShutdown() {
        $error = error_get_last();
        if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            $fatalError = [
                'type' => 'fatal',
                'level' => $error['type'],
                'message' => $error['message'],
                'file' => $error['file'],
                'line' => $error['line'],
                'timestamp' => date('Y-m-d H:i:s'),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ];

            self::log($fatalError);

            // Réponse d'erreur pour les erreurs fatales
            if (!headers_sent()) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Erreur critique du serveur'
                ]);
            }
        }
    }

    /**
     * Logging structuré des erreurs
     */
    private static function log($error) {
        $logEntry = json_encode($error, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;

        // Écrire dans le fichier de log
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);

        // Envoi à un service de monitoring externe si configuré
        if (function_exists('error_log')) {
            error_log($logEntry);
        }
    }

    /**
     * Validation d'une valeur avec gestion d'erreur
     */
    public static function validate($value, $rules = []) {
        $errors = [];

        foreach ($rules as $rule => $param) {
            switch ($rule) {
                case 'required':
                    if (empty($value)) {
                        $errors[] = 'Champ requis';
                    }
                    break;

                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = 'Email invalide';
                    }
                    break;

                case 'min_length':
                    if (strlen($value) < $param) {
                        $errors[] = "Longueur minimale: $param caractères";
                    }
                    break;

                case 'max_length':
                    if (strlen($value) > $param) {
                        $errors[] = "Longueur maximale: $param caractères";
                    }
                    break;

                case 'regex':
                    if (!preg_match($param, $value)) {
                        $errors[] = 'Format invalide';
                    }
                    break;
            }
        }

        return $errors;
    }
}

/**
 * Fonction utilitaire pour les réponses d'erreur standardisées
 */
function sendError($message, $code = 400, $debug = null) {
    $config = require __DIR__ . '/config.php';
    $isDebug = $config['app']['debug'] ?? false;

    $response = ['success' => false, 'error' => $message];

    if ($isDebug && $debug) {
        $response['debug'] = $debug;
    }

    http_response_code($code);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Fonction utilitaire pour les réponses de succès standardisées
 */
function sendSuccess($data = [], $code = 200) {
    $response = array_merge(['success' => true], $data);
    http_response_code($code);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}
?>