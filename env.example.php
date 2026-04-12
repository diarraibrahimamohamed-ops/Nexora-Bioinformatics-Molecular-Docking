<?php
/**
 * EXEMPLE de configuration d'environnement pour Nexora
 * COPIEZ CE FICHIER VERS env.php ET MODIFIEZ LES VALEURS
 */

// NE PAS UTILISER CES VALEURS EN PRODUCTION !
return [
    // ==========================================
    // BASE DE DONNÉES
    // ==========================================
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => 3306,
    'DB_NAME' => 'nexora_db',
    'DB_USER' => 'root',
    'DB_PASS' => '',

    // ==========================================
    // CLÉS API (OBLIGATOIRES)
    // ==========================================
    // Obtenez une clé NCBI gratuite: https://www.ncbi.nlm.nih.gov/account/settings/
    'NCBI_API_KEY' => 'votre_cle_ncbi_api_ici',

    // Obtenez une clé HuggingFace gratuite: https://huggingface.co/settings/tokens
    'HUGGINGFACE_API_KEY' => 'votre_cle_huggingface_api_ici',

    // ==========================================
    // CONFIGURATION APPLICATION
    // ==========================================
    'APP_ENV' => 'development',
    'APP_DEBUG' => true,
    'UPLOAD_DIR' => __DIR__ . '/uploads',
    'MAX_FILE_SIZE' => 10485760, // 10MB

    // ==========================================
    // SÉCURITÉ
    // ==========================================
    // Générez une clé secrète unique (64 caractères minimum)
    'JWT_SECRET' => 'votre_cle_jwt_super_secrete_unique_ici',
    'SESSION_LIFETIME' => 3600, // 1 heure
    'MAX_LOGIN_ATTEMPTS' => 5,

    // ==========================================
    // CACHE ET PERFORMANCE
    // ==========================================
    'REDIS_HOST' => 'localhost',
    'REDIS_PORT' => 6379,
    'CACHE_TTL' => 3600, // 1 heure
];