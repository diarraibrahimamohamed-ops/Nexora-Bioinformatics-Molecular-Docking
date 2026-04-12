<?php
/**
 * API pour la gestion des ligands validés scientifiquement
 * Conforme aux standards internationaux de la recherche pharmaceutique
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion des requêtes OPTIONS pour CORS
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simuler $_GET pour les tests en ligne de commande
if (php_sapi_name() === 'cli') {
    parse_str($argv[1] ?? '', $_GET);
}

$action = $_GET['action'] ?? '';

// Fonctions utilitaires
function respond($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getPost($key) {
    return $_POST[$key] ?? null;
}

// Connexion à la base de données
function getPDO() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $config = require __DIR__ . '/config.php';
            $dbConfig = $config['db'];
            
            // Utiliser le socket Unix pour XAMPP
            if ($dbConfig['socket']) {
                $dsn = "mysql:unix_socket={$dbConfig['socket']};dbname={$dbConfig['dbname']};charset=utf8mb4";
            } else {
                $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset=utf8mb4";
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $options);
            
        } catch (PDOException $e) {
            error_log("Erreur de connexion base de données: " . $e->getMessage());
            respond(['success' => false, 'error' => 'Erreur de connexion à la base de données'], 500);
        }
    }
    
    return $pdo;
}

// ---------- FONCTIONS LIGANDS VALIDÉS ----------
function getValidatedLigands() {
    try {
        $pdo = getPDO();
        
        $category = isset($_GET['category']) ? $_GET['category'] : '';
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        $where_conditions = [];
        $params = [];
        
        if (!empty($category)) {
            $where_conditions[] = "category = ?";
            $params[] = $category;
        }
        
        if (!empty($status)) {
            $where_conditions[] = "status = ?";
            $params[] = $status;
        }
        
        $where_clause = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";
        
        // Récupérer les ligands avec pagination
        $sql = "
            SELECT 
                id, name, smiles, molecular_weight, logp, 
                hydrogen_bond_donors, hydrogen_bond_acceptors, rotatable_bonds,
                topological_polar_surface_area, drug_likeness_score, category,
                description, pubchem_cid, chebi_id, status, binding_affinity_kcal
            FROM validated_ligands 
            {$where_clause}
            ORDER BY drug_likeness_score DESC, name ASC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $ligands = $stmt->fetchAll();
        
        // Compter le total pour pagination
        $count_sql = "
            SELECT COUNT(*) as total 
            FROM validated_ligands 
            {$where_clause}
        ";
        $count_params = array_slice($params, 0, -2); // Exclure limit et offset
        $count_stmt = $pdo->prepare($count_sql);
        $count_stmt->execute($count_params);
        $total = $count_stmt->fetch()['total'];
        
        // Ajouter des informations de validation scientifique
        foreach ($ligands as &$ligand) {
            $ligand['lipinski_violations'] = checkLipinskiRule($ligand);
            $ligand['drug_likeness_status'] = getDrugLikenessStatus($ligand['drug_likeness_score']);
            $ligand['binding_potential'] = assessBindingPotential($ligand);
        }
        
        respond([
            'success' => true,
            'ligands' => $ligands,
            'total' => $total,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Erreur getValidatedLigands: " . $e->getMessage());
        respond(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

function getLigandById() {
    try {
        $pdo = getPDO();
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            respond(['success' => false, 'error' => 'ID de ligand requis'], 400);
        }
        
        $stmt = $pdo->prepare("
            SELECT * FROM validated_ligands WHERE id = ?
        ");
        $stmt->execute([$id]);
        $ligand = $stmt->fetch();
        
        if (!$ligand) {
            respond(['success' => false, 'error' => 'Ligand non trouvé'], 404);
        }
        
        // Ajouter les informations de validation
        $ligand['lipinski_violations'] = checkLipinskiRule($ligand);
        $ligand['drug_likeness_status'] = getDrugLikenessStatus($ligand['drug_likeness_score']);
        $ligand['binding_potential'] = assessBindingPotential($ligand);
        
        respond(['success' => true, 'ligand' => $ligand]);
        
    } catch (PDOException $e) {
        error_log("Erreur getLigandById: " . $e->getMessage());
        respond(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

function searchLigands() {
    try {
        $pdo = getPDO();
        $query = isset($_GET['q']) ? strtolower(trim($_GET['q'])) : '';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
        
        if (strlen($query) < 2) {
            respond(['success' => false, 'error' => 'Requête trop courte (min 2 caractères)'], 400);
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                id, name, smiles, molecular_weight, category, status,
                drug_likeness_score, description, pubchem_cid
            FROM validated_ligands 
            WHERE name LIKE ? OR smiles LIKE ? OR description LIKE ?
            ORDER BY 
                CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
                drug_likeness_score DESC
            LIMIT ?
        ");
        
        $search_pattern = "%{$query}%";
        $exact_pattern = "{$query}%";
        $stmt->execute([$search_pattern, $search_pattern, $search_pattern, $exact_pattern, $limit]);
        $results = $stmt->fetchAll();
        
        respond([
            'success' => true,
            'query' => $query,
            'results' => $results,
            'count' => count($results)
        ]);
        
    } catch (PDOException $e) {
        error_log("Erreur searchLigands: " . $e->getMessage());
        respond(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

function getLigandCategories() {
    try {
        $pdo = getPDO();
        
        $stmt = $pdo->prepare("
            SELECT category, COUNT(*) as count
            FROM validated_ligands 
            GROUP BY category
            ORDER BY count DESC, category ASC
        ");
        $stmt->execute();
        $categories = $stmt->fetchAll();
        
        respond([
            'success' => true,
            'categories' => $categories
        ]);
        
    } catch (PDOException $e) {
        error_log("Erreur getLigandCategories: " . $e->getMessage());
        respond(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

function validateLigandSelection() {
    try {
        $pdo = getPDO();
        $ligand_id = getPost('ligand_id') ?: 0;
        $analysis_id = getPost('analysis_id') ?: 0;
        
        if (!$ligand_id || !$analysis_id) {
            respond(['success' => false, 'error' => 'ID ligand et analyse requis'], 400);
        }
        
        // Récupérer les informations du ligand
        $stmt = $pdo->prepare("SELECT * FROM validated_ligands WHERE id = ?");
        $stmt->execute([$ligand_id]);
        $ligand = $stmt->fetch();
        
        if (!$ligand) {
            respond(['success' => false, 'error' => 'Ligand non trouvé'], 404);
        }
        
        // Récupérer les informations de l'analyse
        $stmt = $pdo->prepare("
            SELECT a.id, a.name, a.data 
            FROM analyses a 
            WHERE a.id = ?
        ");
        $stmt->execute([$analysis_id]);
        $analysis = $stmt->fetch();
        
        if (!$analysis) {
            respond(['success' => false, 'error' => 'Analyse non trouvée'], 404);
        }
        
        // Validation de compatibilité
        $compatibility = validateCompatibility($ligand, $analysis);
        
        respond([
            'success' => true,
            'validation' => [
                'ligand_valid' => true,
                'ligand_info' => [
                    'name' => $ligand['name'],
                    'smiles' => $ligand['smiles'],
                    'category' => $ligand['category'],
                    'status' => $ligand['status'],
                    'drug_likeness_score' => $ligand['drug_likeness_score']
                ],
                'compatibility_score' => $compatibility['score'],
                'compatibility_notes' => $compatibility['notes'],
                'recommended_parameters' => $compatibility['parameters'],
                'warnings' => $compatibility['warnings']
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Erreur validateLigandSelection: " . $e->getMessage());
        respond(['success' => false, 'error' => 'Erreur base de données: ' . $e->getMessage()], 500);
    }
}

function checkLipinskiRule($ligand) {
    $violations = [];
    
    if ($ligand['molecular_weight'] > 500) {
        $violations[] = 'Poids moléculaire > 500 Da';
    }
    
    if ($ligand['logp'] > 5) {
        $violations[] = 'LogP > 5';
    }
    
    if ($ligand['hydrogen_bond_donors'] > 5) {
        $violations[] = 'Donneurs H > 5';
    }
    
    if ($ligand['hydrogen_bond_acceptors'] > 10) {
        $violations[] = 'Accepteurs H > 10';
    }
    
    return $violations;
}

function getDrugLikenessStatus($score) {
    if ($score >= 0.8) return 'excellent';
    if ($score >= 0.6) return 'good';
    if ($score >= 0.4) return 'moderate';
    if ($score >= 0.2) return 'poor';
    return 'very_poor';
}

function assessBindingPotential($ligand) {
    $score = 0;
    $factors = [];
    
    $score += $ligand['drug_likeness_score'] * 40;
    $factors[] = "Drug-likeness: {$ligand['drug_likeness_score']}";
    
    if ($ligand['rotatable_bonds'] <= 7) {
        $score += 20;
        $factors[] = "Flexibilité optimale";
    } elseif ($ligand['rotatable_bonds'] <= 10) {
        $score += 10;
        $factors[] = "Flexibilité modérée";
    }
    
    if ($ligand['topological_polar_surface_area'] >= 20 && $ligand['topological_polar_surface_area'] <= 140) {
        $score += 20;
        $factors[] = "Surface polaire optimale";
    }
    
    switch ($ligand['status']) {
        case 'approved':
            $score += 20;
            $factors[] = "Médicament approuvé";
            break;
        case 'experimental':
            $score += 10;
            $factors[] = "Expérimental";
            break;
    }
    
    return [
        'score' => min(100, $score),
        'factors' => $factors,
        'rating' => $score >= 80 ? 'excellent' : ($score >= 60 ? 'good' : ($score >= 40 ? 'moderate' : 'poor'))
    ];
}

function validateCompatibility($ligand, $analysis) {
    $score = 75;
    $notes = [];
    $warnings = [];
    $parameters = [];
    
    // Analyser les données de l'analyse
    $data = json_decode($analysis['data'], true);
    $protein_data = $data['protein_data'] ?? [];
    
    // Évaluation basée sur la catégorie du ligand
    $category_scores = [
        'kinase_inhibitor' => 90,
        'protease_inhibitor' => 85,
        'antibiotic' => 80,
        'antineoplastic' => 85,
        'anti-inflammatory' => 75,
        'antiviral' => 80,
        'neurotransmitter' => 70,
        'vitamin' => 60,
        'steroid' => 75,
        'analgesic' => 75,
        'stimulant' => 70,
        'opioid' => 75,
        'benzodiazepine' => 75,
        'nucleotide' => 80,
        'cofactor' => 75,
        'polyphenol' => 70,
        'flavonoid' => 65
    ];
    
    $baseScore = isset($category_scores[$ligand['category']]) ? $category_scores[$ligand['category']] : 70;
    $score = $baseScore;
    $notes[] = "Score de base pour catégorie {$ligand['category']}: " . $baseScore;
    
    if ($ligand['drug_likeness_score'] >= 0.8) {
        $score += 10;
        $notes[] = "Excellent drug-likeness (+10)";
    } elseif ($ligand['drug_likeness_score'] >= 0.6) {
        $score += 5;
        $notes[] = "Bon drug-likeness (+5)";
    }
    
    $parameters = [
        'exhaustiveness' => 8,
        'num_modes' => 9,
        'energy_range' => 3,
        'search_space_radius' => 20
    ];
    
    if ($ligand['molecular_weight'] > 400) {
        $parameters['exhaustiveness'] = 12;
        $parameters['num_modes'] = 20;
        $parameters['energy_range'] = 5;
        $notes[] = "Paramètres augmentés pour ligand de grande taille";
    }
    
    $violations = checkLipinskiRule($ligand);
    if (!empty($violations)) {
        $warnings[] = "Violations de Lipinski: " . implode(', ', $violations);
        $score -= 10;
    }
    
    if ($ligand['status'] === 'research') {
        $warnings[] = "Ligand de recherche - validation expérimentale requise";
        $score -= 5;
    }
    
    return [
        'score' => max(0, min(100, $score)),
        'notes' => $notes,
        'warnings' => $warnings,
        'parameters' => $parameters
    ];
}

// ---------- ROUTEUR ----------
switch ($action) {
    case 'get_validated_ligands':
        getValidatedLigands();
        break;
        
    case 'get_ligand_by_id':
        getLigandById();
        break;
        
    case 'search_ligands':
        searchLigands();
        break;
        
    case 'get_ligand_categories':
        getLigandCategories();
        break;
        
    case 'validate_ligand_selection':
        validateLigandSelection();
        break;
        
    default:
        respond(['error' => 'Action inconnue', 'action' => $action], 400);
        break;
}

?>
