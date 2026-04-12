-- ==========================================
-- MODULE D'AMARRAGE MOLÉCULAIRE - DOCKING
-- ==========================================

-- Table pour stocker les résultats de docking moléculaire
CREATE TABLE docking_results (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT UNSIGNED NOT NULL,
    protein_sequence LONGTEXT NOT NULL COMMENT 'Séquence protéique brute (FASTA) utilisée pour le docking',
    ligand_smiles VARCHAR(1000) NOT NULL COMMENT 'Structure du ligand en format SMILES',
    docking_score DECIMAL(10,4) NULL COMMENT 'Score d\'énergie de liaison (kcal/mol)',
    binding_energy DECIMAL(10,4) NULL COMMENT 'Énergie de liaison calculée',
    pose_data JSON NULL COMMENT 'Coordonnées 3D de la pose optimale',
    receptor_file VARCHAR(500) NULL COMMENT 'Fichier PDBQT du récepteur (temporaire)',
    ligand_file VARCHAR(500) NULL COMMENT 'Fichier PDBQT du ligand (temporaire)',
    vina_log LONGTEXT NULL COMMENT 'Log complet d\'AutoDock Vina',
    modeling_method ENUM('modeller', 'alphafold', 'homology') DEFAULT 'modeller',
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT NULL COMMENT 'Message d\'erreur si échec',
    execution_time DECIMAL(8,3) NULL COMMENT 'Temps d\'exécution (secondes)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour les performances
    INDEX idx_analysis (analysis_id),
    INDEX idx_status (status),
    INDEX idx_score (docking_score),
    INDEX idx_created_at (created_at),

    -- Clé étrangère
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Résultats d\'amarrage moléculaire pour Nexora';

-- Table pour stocker les métadonnées des protéines dockées
CREATE TABLE protein_metadata (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT UNSIGNED NOT NULL,
    protein_sequence_hash VARCHAR(64) NOT NULL UNIQUE COMMENT 'SHA-256 de la séquence pour déduplication',
    sequence_length INT UNSIGNED NOT NULL,
    organism_type ENUM('bacteria', 'virus', 'eukaryote', 'unknown') DEFAULT 'unknown',
    gene_name VARCHAR(255) NULL,
    protein_name VARCHAR(255) NULL,
    molecular_weight DECIMAL(10,2) NULL COMMENT 'Poids moléculaire en Daltons',
    isoelectric_point DECIMAL(5,2) NULL COMMENT 'Point isoélectrique',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les performances
    INDEX idx_analysis (analysis_id),
    INDEX idx_hash (protein_sequence_hash),
    INDEX idx_organism (organism_type),

    -- Clé étrangère
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Métadonnées des protéines analysées pour docking';

-- Table pour la cache des structures 3D temporaires
CREATE TABLE temp_structures (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    protein_sequence_hash VARCHAR(64) NOT NULL,
    structure_pdb LONGTEXT NOT NULL COMMENT 'Structure 3D au format PDB (temporaire)',
    modeling_method ENUM('modeller', 'alphafold', 'homology') DEFAULT 'modeller',
    confidence_score DECIMAL(5,4) NULL COMMENT 'Score de confiance de la modélisation',
    expires_at TIMESTAMP NOT NULL COMMENT 'Date d\'expiration pour nettoyage automatique',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index pour les performances et nettoyage
    INDEX idx_hash (protein_sequence_hash),
    INDEX idx_expires (expires_at),
    UNIQUE KEY unique_protein_method (protein_sequence_hash, modeling_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cache des structures 3D temporaires pour docking';

-- Procédure stockée pour nettoyage automatique des structures temporaires
DELIMITER ;;
CREATE PROCEDURE cleanup_temp_structures()
BEGIN
    DELETE FROM temp_structures WHERE expires_at < NOW();
END;;
DELIMITER ;

-- Événement pour nettoyage automatique toutes les heures
DELIMITER ;;
CREATE EVENT cleanup_docking_structures
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    CALL cleanup_temp_structures();
END;;
DELIMITER ;

-- Vue pour les résultats de docking avec métadonnées
CREATE VIEW docking_results_view AS
SELECT 
    dr.id,
    dr.analysis_id,
    a.name as analysis_name,
    a.user_id,
    dr.protein_sequence,
    dr.ligand_smiles,
    dr.docking_score,
    dr.binding_energy,
    dr.pose_data,
    dr.modeling_method,
    dr.status,
    dr.execution_time,
    dr.created_at,
    pm.sequence_length,
    pm.organism_type,
    pm.gene_name,
    pm.protein_name,
    pm.molecular_weight
FROM docking_results dr
LEFT JOIN analyses a ON dr.analysis_id = a.id
LEFT JOIN protein_metadata pm ON dr.analysis_id = pm.analysis_id;

-- Validation de l'intégrité
COMMIT;

-- Message de succès
SELECT 'Module d\'amarrage moléculaire initialisé avec succès !' as status;
