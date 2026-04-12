<?php
/**
 * Système de cache unifié pour Nexora
 * Supporte Redis avec fallback sur système de fichiers
 */

class Cache {
    private $redis = null;
    private $cacheDir;
    private $defaultTtl;

    public function __construct($config = null) {
        $this->cacheDir = __DIR__ . '/cache';
        $this->defaultTtl = 3600;

        if ($config) {
            $this->cacheDir = $config['cache_dir'] ?? $this->cacheDir;
            $this->defaultTtl = $config['ttl'] ?? $this->defaultTtl;

            // Initialiser Redis si disponible
            if (extension_loaded('redis') && isset($config['redis_host'])) {
                try {
                    $this->redis = new Redis();
                    $this->redis->connect($config['redis_host'], $config['redis_port'] ?? 6379);
                    $this->redis->setOption(Redis::OPT_SERIALIZER, Redis::SERIALIZER_JSON);
                } catch (Exception $e) {
                    $this->redis = null;
                    error_log('Redis non disponible: ' . $e->getMessage());
                }
            }
        }

        // Créer le répertoire de cache si nécessaire
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * Récupère une valeur du cache
     */
    public function get($key) {
        if ($this->redis) {
            $value = $this->redis->get($key);
            return $value !== false ? $value : null;
        }

        $file = $this->getFilePath($key);
        if (!file_exists($file)) {
            return null;
        }

        $data = json_decode(file_get_contents($file), true);
        if (!$data || !isset($data['expires']) || time() > $data['expires']) {
            unlink($file);
            return null;
        }

        return $data['value'];
    }

    /**
     * Stocke une valeur dans le cache
     */
    public function set($key, $value, $ttl = null) {
        $ttl = $ttl ?? $this->defaultTtl;

        if ($this->redis) {
            return $this->redis->setex($key, $ttl, $value);
        }

        $file = $this->getFilePath($key);
        $data = [
            'value' => $value,
            'expires' => time() + $ttl
        ];

        return file_put_contents($file, json_encode($data)) !== false;
    }

    /**
     * Vérifie si une clé existe dans le cache
     */
    public function has($key) {
        return $this->get($key) !== null;
    }

    /**
     * Supprime une clé du cache
     */
    public function delete($key) {
        if ($this->redis) {
            return $this->redis->del($key) > 0;
        }

        $file = $this->getFilePath($key);
        if (file_exists($file)) {
            return unlink($file);
        }

        return true;
    }

    /**
     * Vide tout le cache
     */
    public function clear() {
        if ($this->redis) {
            return $this->redis->flushDB();
        }

        $files = glob($this->cacheDir . '/*.cache');
        foreach ($files as $file) {
            unlink($file);
        }

        return true;
    }

    /**
     * Récupère ou définit une valeur avec callback
     */
    public function remember($key, $ttl, $callback) {
        $value = $this->get($key);
        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        $this->set($key, $value, $ttl);
        return $value;
    }

    /**
     * Génère le chemin du fichier cache
     */
    private function getFilePath($key) {
        return $this->cacheDir . '/' . md5($key) . '.cache';
    }

    /**
     * Statistiques du cache
     */
    public function getStats() {
        if ($this->redis) {
            $info = $this->redis->info();
            return [
                'type' => 'redis',
                'hits' => $info['keyspace_hits'] ?? 0,
                'misses' => $info['keyspace_misses'] ?? 0,
                'keys' => $this->redis->dbSize()
            ];
        }

        $files = glob($this->cacheDir . '/*.cache');
        return [
            'type' => 'file',
            'files' => count($files),
            'size' => array_sum(array_map('filesize', $files))
        ];
    }
}

// Instance globale du cache
$config = require __DIR__ . '/config.php';
$cache = new Cache($config['cache']);

// Fonctions utilitaires pour un accès facile
function cache_get($key) {
    global $cache;
    return $cache->get($key);
}

function cache_set($key, $value, $ttl = null) {
    global $cache;
    return $cache->set($key, $value, $ttl);
}

function cache_remember($key, $ttl, $callback) {
    global $cache;
    return $cache->remember($key, $ttl, $callback);
}
?>