<?php
/**
 * API REST principale de Nexora
 * Architecture sécurisée avec séparation des responsabilités
 */

// Initialisation du système d'erreurs
require_once __DIR__ . '/ErrorHandler.php';

// Chargement sécurisé de la configuration
$config = require __DIR__ . '/config.php';
ErrorHandler::init($config);

// Chargement du cache
require_once __DIR__ . '/Cache.php';

$dbcfg = $config['db'];
$apiKeys = $config['api_keys'];
$appConfig = $config['app'];
$securityConfig = $config['security'];

$NCBI_API_KEY = $apiKeys['ncbi'];
$HUGGINGFACE_API_KEY = $apiKeys['huggingface'];
$UPLOAD_DIR = $appConfig['upload_dir'];

// Headers de sécurité
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Gestion des erreurs en mode debug uniquement
if ($appConfig['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

if (!is_dir($UPLOAD_DIR)) mkdir($UPLOAD_DIR, 0755, true);

function getPDO() {
    global $dbcfg;
    static $pdo = null;
    if ($pdo) return $pdo;

    // Utiliser le socket XAMPP pour la connexion
    if (isset($dbcfg['socket']) && $dbcfg['socket']) {
        $dsn = "mysql:unix_socket={$dbcfg['socket']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    } else {
        // Fallback: host/port
        $dsn = "mysql:host={$dbcfg['host']};port={$dbcfg['port']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    }
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ];
    
    try {
        $pdo = new PDO($dsn, $dbcfg['user'], $dbcfg['pass'], $options);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
        exit;
    }
    return $pdo;
}

function respond($obj, $code = 200) {
    http_response_code($code);
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit;
}

// Simuler getPost function
if (!function_exists('getPost')) {
    function getPost($key, $default = null) {
        return $_POST[$key] ?? $default;
    }
}

// ---------- FONCTIONS LIGANDS VALIDÉS ----------
function getValidatedLigandsData() {
    return [
        [
            'id' => 1,
            'name' => 'Acétaminophène',
            'smiles' => 'CC(=O)NC1=CC=C(C=C1)O',
            'molecular_weight' => 151.16,
            'logp' => 0.49,
            'hydrogen_bond_donors' => 2,
            'hydrogen_bond_acceptors' => 3,
            'rotatable_bonds' => 1,
            'topological_polar_surface_area' => 49.33,
            'drug_likeness_score' => 0.847,
            'category' => 'analgesic',
            'description' => 'Analgésique et antipyrétique courant',
            'pubchem_cid' => 1983,
            'status' => 'approved'
        ],
        [
            'id' => 2,
            'name' => 'Ibuprofène',
            'smiles' => 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
            'molecular_weight' => 206.28,
            'logp' => 3.50,
            'hydrogen_bond_donors' => 1,
            'hydrogen_bond_acceptors' => 2,
            'rotatable_bonds' => 4,
            'topological_polar_surface_area' => 37.30,
            'drug_likeness_score' => 0.721,
            'category' => 'anti-inflammatory',
            'description' => 'AINS anti-inflammatoire',
            'pubchem_cid' => 3672,
            'status' => 'approved'
        ],
        [
            'id' => 3,
            'name' => 'Aspirine',
            'smiles' => 'CC(=O)OC1=CC=CC=C1C(=O)O',
            'molecular_weight' => 180.16,
            'logp' => 1.19,
            'hydrogen_bond_donors' => 1,
            'hydrogen_bond_acceptors' => 4,
            'rotatable_bonds' => 3,
            'topological_polar_surface_area' => 63.60,
            'drug_likeness_score' => 0.756,
            'category' => 'anti-inflammatory',
            'description' => 'AINS et antiplaquettaire',
            'pubchem_cid' => 2244,
            'status' => 'approved'
        ],
        [
            'id' => 4,
            'name' => 'Caféine',
            'smiles' => 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
            'molecular_weight' => 194.19,
            'logp' => -0.07,
            'hydrogen_bond_donors' => 0,
            'hydrogen_bond_acceptors' => 6,
            'rotatable_bonds' => 0,
            'topological_polar_surface_area' => 58.44,
            'drug_likeness_score' => 0.693,
            'category' => 'stimulant',
            'description' => 'Stimulant du système nerveux central',
            'pubchem_cid' => 2519,
            'status' => 'approved'
        ],
        [
            'id' => 5,
            'name' => 'Morphine',
            'smiles' => 'CN1CC[C@]23C4=C5C=CC(=C4[C@H]1CC2=C3C(=C5)O)O',
            'molecular_weight' => 285.34,
            'logp' => 0.89,
            'hydrogen_bond_donors' => 2,
            'hydrogen_bond_acceptors' => 5,
            'rotatable_bonds' => 2,
            'topological_polar_surface_area' => 52.93,
            'drug_likeness_score' => 0.634,
            'category' => 'opioid',
            'description' => 'Analésique opioïde puissant',
            'pubchem_cid' => 5288826,
            'status' => 'approved'
        ]
    ];
}

function getValidatedLigandsStandalone() {
    $ligands = getValidatedLigandsData();
    
    $category = $_GET['category'] ?? '';
    $status = $_GET['status'] ?? '';
    $limit = intval($_GET['limit'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);
    
    $filtered_ligands = $ligands;
    
    if (!empty($category)) {
        $filtered_ligands = array_filter($filtered_ligands, function($ligand) use ($category) {
            return $ligand['category'] === $category;
        });
    }
    
    if (!empty($status)) {
        $filtered_ligands = array_filter($filtered_ligands, function($ligand) use ($status) {
            return $ligand['status'] === $status;
        });
    }
    
    foreach ($filtered_ligands as &$ligand) {
        $ligand['lipinski_violations'] = checkLipinskiRule($ligand);
        $ligand['drug_likeness_status'] = getDrugLikenessStatus($ligand['drug_likeness_score']);
        $ligand['binding_potential'] = assessBindingPotential($ligand);
    }
    
    $total = count($filtered_ligands);
    $ligands_page = array_slice($filtered_ligands, $offset, $limit);
    
    respond([
        'success' => true,
        'ligands' => array_values($ligands_page),
        'total' => $total,
        'pagination' => [
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);
}

function getLigandByIdStandalone() {
    $ligands = getValidatedLigandsData();
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        respond(['success' => false, 'error' => 'ID de ligand requis'], 400);
    }
    
    $ligand = null;
    foreach ($ligands as $l) {
        if ($l['id'] == $id) {
            $ligand = $l;
            break;
        }
    }
    
    if (!$ligand) {
        respond(['success' => false, 'error' => 'Ligand non trouvé'], 404);
    }
    
    $ligand['lipinski_violations'] = checkLipinskiRule($ligand);
    $ligand['drug_likeness_status'] = getDrugLikenessStatus($ligand['drug_likeness_score']);
    $ligand['binding_potential'] = assessBindingPotential($ligand);
    
    respond(['success' => true, 'ligand' => $ligand]);
}

function searchLigandsStandalone() {
    $ligands = getValidatedLigandsData();
    $query = strtolower(trim($_GET['q'] ?? ''));
    $limit = intval($_GET['limit'] ?? 20);
    
    if (strlen($query) < 2) {
        respond(['success' => false, 'error' => 'Requête trop courte (min 2 caractères)'], 400);
    }
    
    $results = [];
    foreach ($ligands as $ligand) {
        if (
            strpos(strtolower($ligand['name']), $query) !== false ||
            strpos(strtolower($ligand['smiles']), $query) !== false ||
            strpos(strtolower($ligand['description']), $query) !== false
        ) {
            $results[] = $ligand;
        }
    }
    
    $results = array_slice($results, 0, $limit);
    
    respond([
        'success' => true,
        'query' => $query,
        'results' => $results,
        'count' => count($results)
    ]);
}

function getLigandCategoriesStandalone() {
    $ligands = getValidatedLigandsData();
    
    $categories = [];
    foreach ($ligands as $ligand) {
        $category = $ligand['category'];
        if (!isset($categories[$category])) {
            $categories[$category] = 0;
        }
        $categories[$category]++;
    }
    
    $category_list = [];
    foreach ($categories as $name => $count) {
        $category_list[] = [
            'category' => $name,
            'count' => $count
        ];
    }
    
    usort($category_list, function($a, $b) {
        return $b['count'] - $a['count'];
    });
    
    respond([
        'success' => true,
        'categories' => $category_list
    ]);
}

function validateLigandSelectionStandalone() {
    $ligands = getValidatedLigandsData();
    $ligand_id = intval(getPost('ligand_id') ?: 0);
    $analysis_id = intval(getPost('analysis_id') ?: 0);
    
    if (!$ligand_id || !$analysis_id) {
        respond(['success' => false, 'error' => 'ID ligand et analyse requis'], 400);
    }
    
    $ligand = null;
    foreach ($ligands as $l) {
        if ($l['id'] == $ligand_id) {
            $ligand = $l;
            break;
        }
    }
    
    if (!$ligand) {
        respond(['success' => false, 'error' => 'Ligand non trouvé'], 404);
    }
    
    $compatibility = validateCompatibility($ligand);
    
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

function validateCompatibility($ligand) {
    $score = 75;
    $notes = [];
    $warnings = [];
    $parameters = [];
    
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
        'benzodiazepine' => 75
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

// ==========================
// ROUTER
// ==========================

$action = $_GET['action'] ?? '';


if ($action === 'search_ncbi') {
    $query = $_GET['query'] ?? '';
    $database = $_GET['database'] ?? 'nucleotide';
    $retmax = min(intval($_GET['limit'] ?? 20), 100); // Limite max 100

    if (empty(trim($query))) {
        respond([
            'success' => false,
            'error' => 'Terme de recherche requis'
        ], 400);
    }

    // Construire l'URL de recherche
    $searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?" . http_build_query([
        'db' => $database,
        'term' => $query,
        'retmax' => $retmax,
        'retmode' => 'json',
        'usehistory' => 'y'
    ]);
    
    if ($NCBI_API_KEY) {
        $searchUrl .= "&api_key=" . urlencode($NCBI_API_KEY);
    }

    $response = @file_get_contents($searchUrl, false, stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Mozilla/5.0 (compatible; NYSUS/1.0)'
        ]
    ]));

    if (!$response) {
        respond([
            'success' => false,
            'error' => 'Impossible de contacter NCBI'
        ], 500);
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['esearchresult'])) {
        respond([
            'success' => false,
            'error' => 'Réponse NCBI invalide'
        ], 500);
    }

    $results = [];
    $idList = $data['esearchresult']['idlist'] ?? [];
    
    if (!empty($idList)) {
        // Récupérer les métadonnées par batch
        $ids = implode(',', array_slice($idList, 0, $retmax));
        $summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?" . http_build_query([
            'db' => $database,
            'id' => $ids,
            'retmode' => 'json'
        ]);
        
        if ($NCBI_API_KEY) {
            $summaryUrl .= "&api_key=" . urlencode($NCBI_API_KEY);
        }

        $summaryResponse = @file_get_contents($summaryUrl);
        if ($summaryResponse) {
            $summaryData = json_decode($summaryResponse, true);
            
            foreach ($idList as $id) {
                if (isset($summaryData['result'][$id])) {
                    $item = $summaryData['result'][$id];
                    $results[] = [
                        'accession' => $id,
                        'title' => $item['title'] ?? '',
                        'organism' => $item['organism'] ?? '',
                        'length' => intval($item['slen'] ?? 0),
                        'update_date' => $item['updatedate'] ?? ''
                    ];
                }
            }
        }
    }

    respond([
        'success' => true,
        'results' => $results,
        'total_count' => intval($data['esearchresult']['count'] ?? 0)
    ]);
}

// 🔹 Récupération d'une séquence NCBI (VERSION CORRIGÉE)
if ($action === 'fetch_ncbi_sequence') {
    $accession = $_GET['accession'] ?? '';
    $database  = $_GET['database'] ?? 'nucleotide';

    if (!$accession) {
        respond([
            'success' => false,
            'error' => 'Paramètre accession manquant'
        ], 400);
    }

    // ÉTAPE 1: Vérifier que l'accession existe avec esummary
    $summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=$database&id=" . urlencode($accession) . "&retmode=json";
    if ($NCBI_API_KEY) {
        $summaryUrl .= "&api_key=" . urlencode($NCBI_API_KEY);
    }

    $summaryResponse = @file_get_contents($summaryUrl, false, stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Mozilla/5.0 (compatible; NYSUS/1.0)',
            'ignore_errors' => true
        ]
    ]));

    if (!$summaryResponse) {
        respond([
            'success' => false,
            'error' => 'Impossible de contacter NCBI. Vérifiez votre connexion internet.'
        ], 500);
    }

    $summaryData = json_decode($summaryResponse, true);
    
    // Vérifier si l'accession existe
    if (isset($summaryData['esummaryresult']) && 
        isset($summaryData['esummaryresult']['error']) && 
        !empty($summaryData['esummaryresult']['error'])) {
        respond([
            'success' => false,
            'error' => 'Accession "' . $accession . '" introuvable dans la base ' . $database
        ], 404);
    }

    // ÉTAPE 2: Récupérer la séquence FASTA
    $fetchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=$database&id=" . urlencode($accession) . "&rettype=fasta&retmode=text";
    if ($NCBI_API_KEY) {
        $fetchUrl .= "&api_key=" . urlencode($NCBI_API_KEY);
    }

    $sequenceData = @file_get_contents($fetchUrl, false, stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Mozilla/5.0 (compatible; NYSUS/1.0)',
            'ignore_errors' => true
        ]
    ]));

    if (!$sequenceData) {
        respond([
            'success' => false,
            'error' => 'Échec de téléchargement depuis NCBI. Réessayez dans quelques secondes.'
        ], 500);
    }

    // ÉTAPE 3: Vérifier le format FASTA
    if (!str_starts_with(trim($sequenceData), '>')) {
        // Vérifier si c'est une erreur HTML ou autre
        if (stripos($sequenceData, '<html') !== false || stripos($sequenceData, 'error') !== false) {
            respond([
                'success' => false,
                'error' => 'NCBI a retourné une erreur: ' . substr(strip_tags($sequenceData), 0, 100) . '...'
            ], 500);
        }
        respond([
            'success' => false,
            'error' => 'Format de réponse NCBI invalide. Accession peut-être incorrecte.'
        ], 400);
    }

    // ÉTAPE 4: Parser le FASTA correctement
    $lines = explode("\n", trim($sequenceData));
    $header = trim(array_shift($lines));
    $sequence = '';
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (!empty($line) && !str_starts_with($line, '>')) {
            $sequence .= $line;
        }
    }

    if (empty($sequence)) {
        respond([
            'success' => false,
            'error' => 'Séquence vide récupérée depuis NCBI'
        ], 400);
    }

    // ÉTAPE 5: Extraire les métadonnées
    $organism = '';
    $gene_name = '';
    if (isset($summaryData['result']) && isset($summaryData['result'][$accession])) {
        $info = $summaryData['result'][$accession];
        $organism = $info['organism'] ?? '';
        $gene_name = $info['title'] ?? '';
    }

    // ÉTAPE 6: Sauvegarder localement
    $saveFolder = __DIR__ . '/ncbi_sequences';
    if (!is_dir($saveFolder)) {
        mkdir($saveFolder, 0755, true);
    }
    file_put_contents("$saveFolder/$accession.fasta", $sequenceData);

    // ÉTAPE 7: Enregistrer dans la base de données
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO ncbi_sequences (accession, database_name, organism, title, sequence, length, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $accession,
            $database,
            $organism,
            $gene_name,
            $sequence,
            strlen($sequence)
        ]);
    } catch (Exception $e) {
        // Log l'erreur mais ne pas faire échouer la requête
        error_log("Erreur sauvegarde NCBI: " . $e->getMessage());
    }

    respond([
        'success' => true,
        'data' => [
            'sequence_data' => $sequence,
            'header' => $header,
            'organism' => $organism,
            'gene_name' => $gene_name,
            'length' => strlen($sequence),
            'accession' => $accession,
            'database' => $database
        ]
    ]);
}


// ---------- SAVE ANALYSIS ----------
if ($action === 'save_analysis') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) respond(['error' => 'Aucun body JSON reçu'], 400);

    $pdo = getPDO();

    $stmt = $pdo->prepare("
        INSERT INTO analyses (user_id, name, type, data, fasta_file)
        VALUES (:uid, :name, :type, :data, :fasta)
    ");
    $data_json = json_encode($body, JSON_UNESCAPED_UNICODE);
    $stmt->execute([
        ':uid' => $body['user_id'] ?? null,
        ':name' => $body['sequence_name'] ?? ('analysis_' . date('Ymd_His')),
        ':type' => $body['sequence_type'] ?? null,
        ':data' => $data_json,
        ':fasta' => $body['fasta_file'] ?? null
    ]);
    $analysis_id = $pdo->lastInsertId();

    if (!empty($body['original_sequence'])) {
        $stmtSeq = $pdo->prepare("
            INSERT INTO sequences (analysis_id, accession, header, sequence, length)
            VALUES (:aid, :acc, :hdr, :seq, :len)
        ");
        $stmtSeq->execute([
            ':aid' => $analysis_id,
            ':acc' => $body['sequence_name'] ?? null,
            ':hdr' => $body['sequence_name'] ?? null,
            ':seq' => $body['original_sequence'],
            ':len' => strlen($body['original_sequence'])
        ]);
    }

    if (!empty($body['mutations']) && is_array($body['mutations'])) {
        $stmtMut = $pdo->prepare("
            INSERT INTO mutations (analysis_id, type, ref_pos, qry_pos, ref_base, qry_base, length)
            VALUES (:aid, :type, :rpos, :qpos, :rbase, :qbase, :len)
        ");
        foreach ($body['mutations'] as $m) {
            $stmtMut->execute([
                ':aid' => $analysis_id,
                ':type' => $m['type'] ?? 'Unknown',
                ':rpos' => $m['position'] ?? null,
                ':qpos' => $m['position'] ?? null,
                ':rbase' => $m['original'] ?? null,
                ':qbase' => $m['mutated'] ?? null,
                ':len' => 1
            ]);
        }
    }

    if (!empty($body['resistance_data']) && is_array($body['resistance_data'])) {
        $stmtAb = $pdo->prepare("
            INSERT INTO antibiotic_profiles (analysis_id, antibiotic, status, score)
            VALUES (:aid, :ab, :status, :score)
        ");
        foreach ($body['resistance_data'] as $antibiotic => $data) {
            $stmtAb->execute([
                ':aid' => $analysis_id,
                ':ab' => $antibiotic,
                ':status' => $data['resistance_level'] ?? 'Unknown',
                ':score' => $data['confidence_score'] ?? null
            ]);
        }
    }

    if (!empty($body['fasta_file'])) {
        $stmtFasta = $pdo->prepare("
            INSERT INTO fasta_files (filename, original_name, size, mime)
            VALUES (:fname, :oname, :size, :mime)
        ");
        $f = $body['fasta_file'];
        if (!is_array($f)) $f = [['filename'=>$f,'original_name'=>$f,'size'=>0,'mime'=>'text/plain']];
        foreach ($f as $file) {
            $stmtFasta->execute([
                ':fname' => $file['filename'] ?? null,
                ':oname' => $file['original_name'] ?? null,
                ':size' => $file['size'] ?? 0,
                ':mime' => $file['mime'] ?? 'text/plain'
            ]);
        }
    }

    respond(['success'=>true, 'analysis_id'=>$analysis_id]);
}

// ---------- DOCKING MOLÉCULAIRE ----------
if ($action === 'start_docking') {
    // Accepter JSON du corps ou paramètres formulaire
    $body = json_decode(file_get_contents('php://input'), true);
    
    if ($body) {
        // Données JSON envoyées (votre interface JavaScript)
        $analysis_id = intval($body['analysis_id'] ?? 0);
        $ligand_smiles = $body['ligand_smiles'] ?? 'CCO';
        error_log("DOCKING JSON: analysis_id=$analysis_id, ligand_smiles=$ligand_smiles");
    } else {
        // Paramètres formulaire (GET/POST)
        $analysis_id = intval(getPost('analysis_id') ?: ($_GET['analysis_id'] ?? 0));
        $ligand_smiles = getPost('ligand_smiles') ?: ($_GET['ligand_smiles'] ?? 'CCO');
        error_log("DOCKING FORM: analysis_id=$analysis_id, ligand_smiles=$ligand_smiles");
    }
    
    // DEBUG: Forcer les valeurs pour tester
    if ($analysis_id == 0) {
        $analysis_id = 20; // Analyse avec séquence protéique
        $ligand_smiles = 'CCO'; // Éthanol pour test
        error_log("DOCKING FORCED: analysis_id=$analysis_id, ligand_smiles=$ligand_smiles");
    }
    
    $execution_time = 0; // Initialiser pour éviter les erreurs de variable non définie
    
    if (!$analysis_id) {
        respond([
            'success' => false,
            'error' => 'analysis_id requis'
        ], 400);
    }
    
    $pdo = getPDO();
    
    // Étape 1: Récupérer la séquence protéique brute depuis la base
    $stmt = $pdo->prepare("
        SELECT a.id, a.name, a.data, a.type
        FROM analyses a
        WHERE a.id = ?
        LIMIT 1
    ");
    $stmt->execute([$analysis_id]);
    $analysis_data = $stmt->fetch();
    
    if (!$analysis_data) {
        respond([
            'success' => false,
            'error' => 'Analyse introuvable'
        ], 404);
    }
    
    // Extraire la séquence protéique depuis le JSON
    $data_json = json_decode($analysis_data['data'], true);
    error_log("DEBUG: Analysis data structure: " . print_r($data_json, true));
    if (!$data_json || !isset($data_json['protein_data']['sequence'])) {
        respond([
            'success' => false,
            'error' => 'Aucune séquence protéique trouvée dans cette analyse'
        ], 404);
    }
    
    $protein_sequence = $data_json['protein_data']['sequence'];
    $analysis_name = $analysis_data['name'];
    
    // Étape 2: Créer l'entrée de docking
    $stmt = $pdo->prepare("
        INSERT INTO docking_results 
        (analysis_id, protein_sequence, ligand_smiles, status, created_at)
        VALUES (?, ?, ?, 'pending', NOW())
    ");
    $stmt->execute([$analysis_id, $protein_sequence, $ligand_smiles]);
    $docking_id = $pdo->lastInsertId();
    
    // Étape 3: Mettre à jour le statut en cours
    $stmt = $pdo->prepare("
        UPDATE docking_results 
        SET status = 'running' 
        WHERE id = ?
    ");
    $stmt->execute([$docking_id]);
    
    // Étape 4: Appeler le script wrapper pour le docking
    $wrapper_script = '/tmp/docking_wrapper.sh';
    
    // Échappement sécurisé des paramètres
    $escaped_analysis_id = escapeshellarg($analysis_id);
    $escaped_smiles = escapeshellarg($ligand_smiles);
    
    $command = "{$wrapper_script} {$escaped_analysis_id} {$escaped_smiles} 2>&1";
    
    // Échappement sécurisé des paramètres
    $escaped_analysis_id = escapeshellarg($analysis_id);
    $escaped_smiles = escapeshellarg($ligand_smiles);

    $command = "{$wrapper_script} {$escaped_analysis_id} {$escaped_smiles} 2>&1";
    
    error_log("WRAPPER SCRIPT: " . $wrapper_script);
    error_log("FULL COMMAND: " . $command);
    
    $start_time = microtime(true);
    $execution_time = 0;
    $result_json = '';
    
    try {
        // Utiliser exec au lieu de shell_exec pour mieux capturer la sortie
        $output = [];
        $return_code = 0;
        exec($command, $output, $return_code);
        $result_json = implode("\n", $output);
        
        // Log pour débogage
        error_log("Professional Docking command: $command");
        error_log("Professional Docking return code: $return_code");
        error_log("Professional Docking output: $result_json");
        
        $execution_time = microtime(true) - $start_time;
        $exit_code = $return_code;
        
        // Vérifier si la sortie est vide
        if (empty(trim($result_json))) {
            error_log("ERREUR: Script Python n'a produit aucune sortie");
            respond([
                'success' => false,
                'error' => 'Le script Python n\'a produit aucune sortie',
                'docking_id' => $docking_id
            ], 500);
        }
        
        // Tenter de parser le JSON de manière plus robuste
        $json_lines = explode("\n", $result_json);
        $json_lines = array_filter($json_lines, function($line) {
            return !empty(trim($line));
        });
        
        if (empty($json_lines)) {
            error_log("ERREUR: Aucune ligne JSON valide trouvée");
            respond([
                'success' => false,
                'error' => 'Aucune donnée JSON valide trouvée',
                'docking_id' => $docking_id
            ], 500);
        }
        
        // Reconstruire le JSON en cherchant la première et dernière accolade
        $first_line = null;
        $last_line = null;
        $brace_count = 0;
        $valid_json = null;
        
        foreach ($json_lines as $line_num => $line) {
            $line = trim($line);
            
            if ($first_line === null && strpos($line, '{') === 0) {
                $first_line = $line_num;
                $brace_count = 0;
            }
            
            if ($first_line !== null) {
                $brace_count += substr_count($line, '{') - substr_count($line, '}');
            }
            
            // Si on trouve la fin du JSON
            if ($brace_count <= 0 && strpos($line, '}') !== false) {
                // Extraire toutes les lignes de la première à la fin
                $valid_json = implode("\n", array_slice($json_lines, $first_line, $line_num + 1));
                break;
            }
        }
        
        if ($valid_json === null) {
            error_log("ERREUR: JSON mal formé - accolades non équilibrées");
            error_log("JSON preview: " . substr($result_json, 0, 500));
            respond([
                'success' => false,
                'error' => 'JSON mal formé - accolades non équilibrées',
                'docking_id' => $docking_id
            ], 500);
        }
        
        // Parser le JSON avec gestion d'erreur
        $docking_result = json_decode($valid_json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON parsing error: " . json_last_error_msg());
            error_log("JSON preview: " . substr($result_json, 0, 500));
            
            $stmt = $pdo->prepare("
                UPDATE docking_results 
                SET status = 'failed', error_message = ?, execution_time = ?
                WHERE id = ?
            ");
            $stmt->execute(["Erreur parsing JSON: " . json_last_error_msg(), $execution_time, $docking_id]);
            
            respond([
                'success' => false,
                'error' => 'Erreur parsing résultat',
                'docking_id' => $docking_id
            ]);
        }
        
        // Debug: Log la réponse brute
        error_log("Raw docking result: " . $result_json);
        error_log("Parsed docking result: " . print_r($docking_result, true));
        
    } catch (Exception $e) {
        $execution_time = microtime(true) - $start_time;
        $exit_code = 1;
        $result_json = json_encode(['error' => $e->getMessage()]);
    }
    
    if (!$docking_result['success']) {
        // Docking échoué mais script exécuté
        $stmt = $pdo->prepare("
            UPDATE docking_results 
            SET status = 'failed', 
                error_message = ?, 
                execution_time = ?,
                vina_log = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $docking_result['error_message'] ?? 'Échec du docking',
            $execution_time,
            $docking_result['vina_log'] ?? null,
            $docking_id
        ]);
        
        respond([
            'success' => false,
            'error' => $docking_result['error_message'] ?? 'Échec du docking',
            'docking_id' => $docking_id
        ], 500);
    }
    
    // Succès: sauvegarder les résultats (compatible avec simple et advanced)
    $stmt = $pdo->prepare("
        UPDATE docking_results 
        SET status = 'completed',
            docking_score = ?,
            binding_energy = ?,
            pose_data = ?,
            vina_log = ?,
            execution_time = ?,
            modeling_method = ?,
            ligand_smiles = ?
        WHERE id = ?
    ");
    
    // Gérer les deux formats: simple (pose_data) et advanced (poses)
    $pose_data = $docking_result['pose_data'] ?? null;
    $poses = $docking_result['poses'] ?? null;
    $interactions = $docking_result['interactions'] ?? null;
    
    // Combiner les données pour compatibilité
    $combined_data = [
        'poses' => $poses,
        'interactions' => $interactions,
        'best_pose' => $poses ? $poses[0] : $pose_data
    ];
    
    $stmt->execute([
        $docking_result['docking_score'],
        $docking_result['binding_energy'],
        json_encode($combined_data),
        $docking_result['vina_log'] ?? null,
        $execution_time,
        $docking_result['modeling_method'] ?? 'vina_real',
        $ligand_smiles,
        $docking_id
    ]);
    
    // Créer les métadonnées de la protéine
    $sequence_hash = hash('sha256', $protein_sequence);
    $sequence_length = strlen($protein_sequence);
    
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO protein_metadata 
        (analysis_id, protein_sequence_hash, sequence_length, organism_type, created_at)
        VALUES (?, ?, ?, 'unknown', NOW())
    ");
    $stmt->execute([$analysis_id, $sequence_hash, $sequence_length]);
    
    // Réponse compatible avec les deux formats
    $response = [
        'success' => true,
        'docking_id' => $docking_id,
        'docking_score' => $docking_result['docking_score'],
        'binding_energy' => $docking_result['binding_energy'],
        'execution_time' => $execution_time,
        'modeling_method' => $docking_result['modeling_method'],
        'pose_data' => $combined_data
    ];
    
    // Ajouter les données avancées si disponibles
    if ($poses) {
        $response['poses'] = $poses;
    }
    if ($interactions) {
        $response['interactions'] = $interactions;
    }
    
    respond($response);
}

// ---------- GET DOCKING RESULTS ----------
if ($action === 'get_docking_results') {
    $analysis_id = intval($_GET['analysis_id'] ?? 0);
    
    if (!$analysis_id) {
        respond([
            'success' => false,
            'error' => 'analysis_id requis'
        ], 400);
    }
    
    $pdo = getPDO();
    
    $stmt = $pdo->prepare("
        SELECT 
            dr.id,
            dr.docking_score,
            dr.binding_energy,
            dr.pose_data,
            dr.status,
            dr.error_message,
            dr.execution_time,
            dr.modeling_method,
            dr.created_at,
            pm.sequence_length,
            pm.organism_type
        FROM docking_results dr
        LEFT JOIN protein_metadata pm ON dr.analysis_id = pm.analysis_id
        WHERE dr.analysis_id = ?
        ORDER BY dr.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$analysis_id]);
    $results = $stmt->fetchAll();
    
    // Conversion des JSON
    foreach ($results as &$result) {
        if ($result['pose_data']) {
            $result['pose_data'] = json_decode($result['pose_data'], true);
        }
    }
    
    respond([
        'success' => true,
        'results' => $results,
        'count' => count($results)
    ]);
}

// ---------- LIGANDS VALIDÉS ----------
if ($action === 'get_validated_ligands') {
    getValidatedLigandsStandalone();
}
elseif ($action === 'get_ligand_by_id') {
    getLigandByIdStandalone();
}
elseif ($action === 'search_ligands') {
    searchLigandsStandalone();
}
elseif ($action === 'get_ligand_categories') {
    getLigandCategoriesStandalone();
}
elseif ($action === 'validate_ligand_selection') {
    validateLigandSelectionStandalone();
}

// ---------- Default Action ----------
respond(['error' => 'Action inconnue', 'action' => $action], 400);

