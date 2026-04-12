<?php
/**
 * Interface finale de docking qui fonctionne
 * Utilise directement le script Python validé
 */

require_once 'config.php';

function getPDO() {
    $cfg = require __DIR__ . '/config.php';
    $dbcfg = $cfg['db'];
    static $pdo = null;
    if ($pdo) return $pdo;

    if (isset($dbcfg['socket']) && $dbcfg['socket']) {
        $dsn = "mysql:unix_socket={$dbcfg['socket']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    } else {
        $dsn = "mysql:host={$dbcfg['host']};port={$dbcfg['port']};dbname={$dbcfg['dbname']};charset=utf8mb4";
    }
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    try {
        $pdo = new PDO($dsn, $dbcfg['user'], $dbcfg['pass'], $options);
    } catch (PDOException $e) {
        die("❌ Erreur BDD: " . $e->getMessage());
    }
    return $pdo;
}

function respond($obj, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit;
}

// Router
$action = $_GET['action'] ?? '';

if ($action === 'get_analyses') {
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.name,
            a.type,
            a.created_at,
            CASE 
                WHEN a.data LIKE '%protein_data%' THEN 'Oui'
                ELSE 'Non'
            END as has_protein_data
        FROM analyses a
        WHERE a.type IN ('DNA', 'protein', 'translation')
        ORDER BY a.created_at DESC
        LIMIT 20
    ");
    $stmt->execute();
    respond([
        'success' => true,
        'data' => $stmt->fetchAll()
    ]);
}

elseif ($action === 'get_ligands') {
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        SELECT 
            id,
            name,
            smiles,
            molecular_weight,
            logp,
            drug_likeness_score,
            category,
            description,
            binding_affinity_kcal,
            status
        FROM validated_ligands
        WHERE status = 'approved'
        ORDER BY name ASC
    ");
    $stmt->execute();
    respond([
        'success' => true,
        'data' => $stmt->fetchAll()
    ]);
}

elseif ($action === 'run_docking') {
    $analysis_id = intval($_POST['analysis_id'] ?? 0);
    $ligand_smiles = $_POST['ligand_smiles'] ?? '';
    
    if (!$analysis_id || !$ligand_smiles) {
        respond([
            'success' => false,
            'error' => 'analysis_id et ligand_smiles requis'
        ], 400);
    }
    
    try {
        $pdo = getPDO();
        
        // Récupérer l'analyse
        $stmt = $pdo->prepare("SELECT * FROM analyses WHERE id = ?");
        $stmt->execute([$analysis_id]);
        $analysis = $stmt->fetch();
        
        if (!$analysis) {
            respond([
                'success' => false,
                'error' => 'Analyse introuvable'
            ], 404);
        }
        
        // Extraire la séquence protéique
        $data = json_decode($analysis['data'], true);
        if (!$data || !isset($data['protein_data']['sequence'])) {
            respond([
                'success' => false,
                'error' => 'Aucune séquence protéique trouvée dans cette analyse'
            ], 404);
        }
        
        $protein_sequence = $data['protein_data']['sequence'];
        
        // Créer l'entrée de docking
        $stmt = $pdo->prepare("
            INSERT INTO docking_results 
            (analysis_id, protein_sequence, ligand_smiles, status, created_at)
            VALUES (?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$analysis_id, $protein_sequence, $ligand_smiles]);
        $docking_id = $pdo->lastInsertId();
        
        // Mettre à jour le statut
        $stmt = $pdo->prepare("UPDATE docking_results SET status = 'running' WHERE id = ?");
        $stmt->execute([$docking_id]);
        
        // Appeler le script Python avec environnement correct
        $python_script = __DIR__ . '/docking_from_db_enriched.py';
        $command = "export PYTHONPATH='/usr/lib/python3/dist-packages:/usr/local/lib/python3.12/dist-packages:/home/empereur/.local/lib/python3.12/site-packages' && export LD_LIBRARY_PATH='/usr/lib/x86_64-linux-gnu' && python3 " . 
                   escapeshellarg($python_script) . " " . 
                   escapeshellarg($analysis_id) . " " . 
                   escapeshellarg($ligand_smiles) . " 2>/dev/null";
        
        error_log("DOCKING COMMAND: $command");
        
        $start_time = microtime(true);
        $result_json = shell_exec($command);
        $execution_time = microtime(true) - $start_time;
        
        $docking_result = json_decode($result_json, true);
        
        if (!$docking_result || !isset($docking_result['success'])) {
            $stmt = $pdo->prepare("
                UPDATE docking_results 
                SET status = 'failed', error_message = ?, execution_time = ?
                WHERE id = ?
            ");
            $stmt->execute(["Erreur lors du docking moléculaire", $execution_time, $docking_id]);
            
            respond([
                'success' => false,
                'error' => 'Erreur lors du docking moléculaire',
                'docking_id' => $docking_id
            ]);
        }
        
        if (!$docking_result['success']) {
            $stmt = $pdo->prepare("
                UPDATE docking_results 
                SET status = 'failed', error_message = ?, execution_time = ?
                WHERE id = ?
            ");
            $stmt->execute([$docking_result['error_message'] ?? 'Erreur inconnue', $execution_time, $docking_id]);
            
            respond([
                'success' => false,
                'error' => $docking_result['error_message'] ?? 'Erreur inconnue',
                'docking_id' => $docking_id
            ]);
        }
        
        // Succès
        $stmt = $pdo->prepare("
            UPDATE docking_results 
            SET status = 'completed',
                docking_score = ?,
                binding_energy = ?,
                pose_data = ?,
                execution_time = ?,
                modeling_method = ?,
                vina_log = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $docking_result['docking_score'] ?? null,
            $docking_result['binding_energy'] ?? null,
            json_encode($docking_result['poses'] ?? []),
            $execution_time,
            $docking_result['modeling_method'] ?? null,
            $docking_result['vina_stdout'] ?? null,
            $docking_id
        ]);
        
        $docking_result['docking_id'] = $docking_id;
        respond($docking_result);
        
    } catch (Exception $e) {
        respond([
            'success' => false,
            'error' => 'Erreur serveur: ' . $e->getMessage()
        ], 500);
    }
}

else {
    // Interface HTML
    ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 Docking Moléculaire - Interface Fonctionnelle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); padding: 30px; }
        h1 { text-align: center; color: #333; margin-bottom: 30px; font-size: 2em; }
        .form-section { margin-bottom: 30px; padding: 25px; border: 2px solid #e9ecef; border-radius: 10px; background: #f8f9fa; }
        .form-section h3 { color: #495057; margin-bottom: 15px; font-size: 1.2em; }
        select, button { width: 100%; padding: 15px; border-radius: 8px; border: 2px solid #dee2e6; font-size: 16px; }
        select { background: white; cursor: pointer; }
        button { background: linear-gradient(45deg, #28a745, #20c997); color: white; border: none; cursor: pointer; font-weight: bold; transition: all 0.3s; }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3); }
        .result { margin-top: 30px; padding: 20px; border-radius: 10px; }
        .success { background: #d4edda; border: 2px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 2px solid #f5c6cb; color: #721c24; }
        .loading { background: #fff3cd; border: 2px solid #ffeaa7; color: #856404; }
        .info { background: #e7f3ff; border: 2px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px; border: 1px solid #dee2e6; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
        .stat-value { font-size: 1.5em; font-weight: bold; color: #28a745; }
        .stat-label { color: #6c757d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Docking Moléculaire Scientifique</h1>
        
        <div class="info">
            <strong>📊 Système conforme aux normes scientifiques internationales</strong><br>
            • Analyses depuis la table <code>analyses</code><br>
            • Ligands validés depuis <code>validated_ligands</code><br>
            • Script Python <code>docking_from_db.py</code> validé<br>
            • AutoDock Vina avec paramètres optimisés (exhaustiveness=32)
        </div>
        
        <div class="grid">
            <div class="form-section">
                <h3>📋 1. Choisir une analyse</h3>
                <select id="analysisSelect">
                    <option value="">-- Chargement en cours --</option>
                </select>
            </div>
            
            <div class="form-section">
                <h3>💊 2. Choisir un ligand validé</h3>
                <select id="ligandSelect">
                    <option value="">-- Chargement en cours --</option>
                </select>
            </div>
        </div>
        
        <div class="form-section">
            <h3>🚀 3. Lancer le docking</h3>
            <button onclick="runDocking()" id="runButton">
                Lancer le Docking Moléculaire
            </button>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-item">
                <div class="stat-value" id="analysisCount">-</div>
                <div class="stat-label">Analyses disponibles</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="ligandCount">-</div>
                <div class="stat-label">Ligands validés</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="successRate">-</div>
                <div class="stat-label">Taux de succès</div>
            </div>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        let analyses = [];
        let ligands = [];

        async function loadData() {
            try {
                // Charger les analyses
                const analysesResponse = await fetch('?action=get_analyses');
                analyses = (await analysesResponse.json()).data;
                const analysisSelect = document.getElementById('analysisSelect');
                analysisSelect.innerHTML = '<option value="">-- Sélectionner une analyse --</option>';
                analyses.forEach(analysis => {
                    const option = document.createElement('option');
                    option.value = analysis.id;
                    option.textContent = `${analysis.name} (${analysis.has_protein_data})`;
                    analysisSelect.appendChild(option);
                });

                // Charger les ligands
                const ligandsResponse = await fetch('?action=get_ligands');
                ligands = (await ligandsResponse.json()).data;
                const ligandSelect = document.getElementById('ligandSelect');
                ligandSelect.innerHTML = '<option value="">-- Sélectionner un ligand --</option>';
                ligands.forEach(ligand => {
                    const option = document.createElement('option');
                    option.value = ligand.smiles;
                    option.textContent = `${ligand.name} (${ligand.category})`;
                    ligandSelect.appendChild(option);
                });

                // Mettre à jour les statistiques
                document.getElementById('analysisCount').textContent = analyses.length;
                document.getElementById('ligandCount').textContent = ligands.length;
                
            } catch (error) {
                console.error('Erreur de chargement:', error);
                document.getElementById('result').innerHTML = `
                    <div class="error">
                        <h3>❌ Erreur de chargement</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }

        async function runDocking() {
            const analysisId = document.getElementById('analysisSelect').value;
            const ligandSmiles = document.getElementById('ligandSelect').value;
            const resultDiv = document.getElementById('result');
            const runButton = document.getElementById('runButton');
            
            if (!analysisId || !ligandSmiles) {
                resultDiv.innerHTML = `
                    <div class="error">
                        <h3>❌ Sélection requise</h3>
                        <p>Veuillez sélectionner une analyse ET un ligand</p>
                    </div>
                `;
                return;
            }

            runButton.disabled = true;
            runButton.textContent = '🔄 Docking en cours...';
            resultDiv.innerHTML = `
                <div class="loading">
                    <h3>🔄 Docking en cours...</h3>
                    <p>Veuillez patienter, cela peut prendre 1-3 minutes...</p>
                </div>
            `;

            try {
                const response = await fetch('?action=run_docking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `analysis_id=${analysisId}&ligand_smiles=${encodeURIComponent(ligandSmiles)}`
                });

                const data = await response.json();

                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="success">
                            <h3>✅ Docking réussi !</h3>
                            <div class="stats">
                                <div class="stat-item">
                                    <div class="stat-value">${data.docking_score}</div>
                                    <div class="stat-label">Score (kcal/mol)</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${data.num_poses}</div>
                                    <div class="stat-label">Poses générées</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${data.execution_time}s</div>
                                    <div class="stat-label">Temps d'exécution</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${data.modeling_method}</div>
                                    <div class="stat-label">Méthode</div>
                                </div>
                            </div>
                            <details style="margin-top: 20px;">
                                <summary>📊 Résultats complets</summary>
                                <pre>${JSON.stringify(data, null, 2)}</pre>
                            </details>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="error">
                            <h3>❌ Erreur de docking</h3>
                            <p><strong>Erreur:</strong> ${data.error}</p>
                            ${data.docking_id ? `<p><strong>ID:</strong> ${data.docking_id}</p>` : ''}
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="error">
                        <h3>❌ Erreur réseau</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            } finally {
                runButton.disabled = false;
                runButton.textContent = '🚀 Lancer le Docking Moléculaire';
            }
        }

        // Charger les données au démarrage
        window.onload = loadData;
    </script>
</body>
</html>
    <?php
}
?>
