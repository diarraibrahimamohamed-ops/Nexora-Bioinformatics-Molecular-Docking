-- Schema de base de données Nexora v2.0
-- Architecture sécurisée avec indexes optimisés

-- Configuration de la base de données
SET SQL_MODE = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";
SET AUTOCOMMIT = 0;

-- ==========================================
-- TABLES UTILISATEURS ET AUTHENTIFICATION
-- ==========================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Hash Argon2ID
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    token VARCHAR(255) NULL, -- JWT temporaire
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour les performances
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Protection contre les attaques par dictionnaire
CREATE TABLE login_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL, -- Support IPv6
    identifier VARCHAR(255) NOT NULL, -- Email ou username
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,

    -- Index pour les requêtes de rate limiting
    INDEX idx_ip_time (ip_address, attempted_at),
    INDEX idx_identifier_time (identifier, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLES BIOINFORMATIQUE
-- ==========================================

CREATE TABLE analyses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- DNA, RNA, Protein
    data JSON NOT NULL, -- Métriques, résultats complets
    fasta_file VARCHAR(500) NULL,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour les performances
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),

    -- Clé étrangère
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sequences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT UNSIGNED NOT NULL,
    accession VARCHAR(100) NULL,
    header TEXT NOT NULL,
    sequence LONGTEXT NOT NULL,
    length INT UNSIGNED NOT NULL,
    type ENUM('dna', 'rna', 'protein') DEFAULT 'dna',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les recherches
    INDEX idx_analysis (analysis_id),
    INDEX idx_accession (accession),
    INDEX idx_type (type),
    FULLTEXT idx_sequence (sequence),

    -- Clé étrangère
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mutations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL, -- substitution, insertion, deletion
    ref_pos INT UNSIGNED NULL,
    qry_pos INT UNSIGNED NULL,
    ref_base CHAR(1) NULL,
    qry_base CHAR(1) NULL,
    length INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les analyses
    INDEX idx_analysis (analysis_id),
    INDEX idx_type (type),

    -- Clé étrangère
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE antibiotic_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT UNSIGNED NOT NULL,
    antibiotic VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- susceptible, resistant, intermediate
    score DECIMAL(5,2) NULL, -- Score de confiance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les recherches
    INDEX idx_analysis (analysis_id),
    INDEX idx_antibiotic (antibiotic),
    INDEX idx_status (status),

    -- Clé étrangère
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLES NCBI ET DONNÉES EXTERNES
-- ==========================================

CREATE TABLE ncbi_sequences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    accession VARCHAR(100) NOT NULL UNIQUE,
    database_name VARCHAR(50) NOT NULL,
    organism VARCHAR(255) NULL,
    title TEXT NULL,
    sequence LONGTEXT NOT NULL,
    length INT UNSIGNED NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les recherches
    INDEX idx_accession (accession),
    INDEX idx_database (database_name),
    INDEX idx_organism (organism),
    INDEX idx_cached_at (cached_at),
    FULLTEXT idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLES FICHIERS ET UPLOADS
-- ==========================================

CREATE TABLE fasta_files (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size INT UNSIGNED NOT NULL,
    mime VARCHAR(100) NOT NULL,
    hash VARCHAR(64) NOT NULL, -- SHA-256
    uploaded_by INT UNSIGNED NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour la sécurité
    INDEX idx_hash (hash),
    INDEX idx_uploaded_by (uploaded_by),

    -- Clé étrangère
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABLES DE CACHE ET OPTIMISATION
-- ==========================================

CREATE TABLE cache_entries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_value LONGTEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour le nettoyage automatique
    INDEX idx_expires (expires_at),
    INDEX idx_key (cache_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- DONNÉES DE TEST (POUR DÉVELOPPEMENT)
-- ==========================================

-- Utilisateur de test (mot de passe: test123!)
INSERT INTO users (username, email, password, status) VALUES
('admin', 'admin@nexora.test', '$argon2id$v=19$m=65536,t=4,p=3$EXAMPLE_SALT_HASH_FOR_TESTING', 'active');

-- Analyses de test
INSERT INTO analyses (user_id, name, type, data, status) VALUES
(1, 'Test Analysis', 'DNA', '{"success": true, "duration": 1.5}', 'completed');

-- Nettoyage automatique des anciennes tentatives de connexion
DELIMITER ;;
CREATE EVENT cleanup_login_attempts
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END;;

-- Nettoyage du cache expiré
CREATE EVENT cleanup_expired_cache
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM cache_entries WHERE expires_at < NOW();
END;;
DELIMITER ;

-- Activation des événements
SET GLOBAL event_scheduler = ON;

-- Validation de l'intégrité
COMMIT;

-- Statistiques et optimisation
ANALYZE TABLE users, analyses, sequences, mutations, antibiotic_profiles, ncbi_sequences, fasta_files;

-- Message de succès
SELECT 'Base de données Nexora initialisée avec succès !' as status;