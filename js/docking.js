/**
 * Module d'Amarrage Moléculaire Nexora - Frontend
 * Interface utilisateur pour le docking moléculaire
 * Conforme aux spécifications OFFICIELLES Nexora
 */

// Variables globales pour le docking
let currentAnalysisId = null;
let dockingInProgress = false;

// Initialisation du module de docking
function initDockingModule() {
    console.log('Initialisation du module docking...');
    loadDockingAnalyses();
    setupDockingEventListeners();
    
    // Forcer le chargement après 2 secondes si rien n'apparaît
    setTimeout(function() {
        const select = document.getElementById('dockingAnalysisSelect');
        if (select && select.options.length <= 1) {
            console.log('Rechargement forcé des analyses...');
            loadDockingAnalyses();
        }
    }, 2000);
}

// Charger les analyses disponibles pour le docking
async function loadDockingAnalyses() {
    try {
        console.log('Chargement des analyses pour docking...');
        const response = await fetch('get_analyses.php');
        const data = await response.json();
        
        console.log('Réponse brute de l\'API:', data); // Debug complet
        
        const select = document.getElementById('dockingAnalysisSelect');
        if (!select) {
            console.error('Element dockingAnalysisSelect non trouvé');
            return;
        }
        
        // Vider le select
        select.innerHTML = '<option value="">Sélectionnez une analyse...</option>';
        
        if (data.success && (data.analyses || data.data)) {
            // Utiliser analyses ou data selon ce qui est disponible
            const analyses = data.analyses || data.data;
            console.log('Nombre d\'analyses trouvées:', analyses.length);
            
            let validAnalysesCount = 0;
            
            analyses.forEach((analysis, index) => {
                console.log(`Analyse ${index}:`, {
                    id: analysis.id,
                    name: analysis.name,
                    type: analysis.type,
                    hasData: !!analysis.data
                });
                
                // Vérifier si l'analyse contient des données protéiques
                if (analysis.data && analysis.data.protein_data && analysis.data.protein_data.sequence) {
                    const proteinSeq = analysis.data.protein_data.sequence;
                    console.log(` Analyse valide avec protéine: ${analysis.name} (${proteinSeq.length} aa)`);
                    
                    const option = document.createElement('option');
                    option.value = analysis.id;
                    option.textContent = `${analysis.name} - ${proteinSeq.length} aa`;
                    select.appendChild(option);
                    validAnalysesCount++;
                } else {
                    console.log(` Analyse sans protéine: ${analysis.name}`);
                }
            });
            
            console.log(`Analyses valides trouvées: ${validAnalysesCount}`);
            
            if (validAnalysesCount === 0) {
                console.log('Aucune analyse avec protéine trouvée');
                select.innerHTML = '<option value="">Aucune analyse avec séquence protéique trouvée</option>';
            }
        } else {
            console.error('Erreur API analyses:', data);
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    } catch (error) {
        console.error('Erreur chargement analyses:', error);
        showNotification('Erreur lors du chargement des analyses', 'error');
        
        const select = document.getElementById('dockingAnalysisSelect');
        if (select) {
            select.innerHTML = '<option value="">Erreur de connexion</option>';
        }
    }
}

// Configurer les écouteurs d'événements
function setupDockingEventListeners() {
    const select = document.getElementById('dockingAnalysisSelect');
    if (select) {
        select.addEventListener('change', function() {
            currentAnalysisId = this.value;
            console.log('Analyse sélectionnée:', currentAnalysisId);
        });
    }
    
    // Ajouter un écouteur sur le focus du select pour forcer le chargement
    if (select) {
        select.addEventListener('focus', function() {
            console.log('Focus sur le select - rechargement des analyses');
            loadDockingAnalyses();
        });
    }
}

// Lancer le processus de docking moléculaire
async function startDocking() {
    console.log('startDocking appelé. currentAnalysisId:', currentAnalysisId);
    
    if (!currentAnalysisId) {
        console.error('Aucune analyse sélectionnée');
        showNotification('Veuillez sélectionner une analyse', 'warning');
        return;
    }
    
    if (dockingInProgress) {
        showNotification('Un docking est déjà en cours', 'warning');
        return;
    }
    
    const ligandSmiles = document.getElementById('ligandSmiles').value.trim();
    if (!ligandSmiles) {
        showNotification('Veuillez sélectionner un ligand validé', 'warning');
        return;
    }
    
    // Vérifier si un ligand est sélectionné
    const ligandSelect = document.getElementById('validatedLigandSelect');
    if (!ligandSelect.value) {
        showNotification('Veuillez sélectionner un ligand dans la liste', 'warning');
        return;
    }
    console.log('Ligand SMILES:', ligandSmiles);
    
    // Validation basique du SMILES
    if (!validateSmiles(ligandSmiles)) {
        showNotification('Format SMILES invalide', 'error');
        return;
    }
    
    console.log('Envoi de la requête de docking...');
    console.log('Données envoyées:', {
        analysis_id: parseInt(currentAnalysisId),
        ligand_smiles: ligandSmiles
    });
    
    dockingInProgress = true;
    showDockingProgress(true);
    disableDockingControls(true);
    
    try {
        const response = await fetch('api.php?action=start_docking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                analysis_id: parseInt(currentAnalysisId),
                ligand_smiles: ligandSmiles
            }),
            signal: AbortSignal.timeout(600000) // 10 minutes timeout
        });
        
        console.log('Réponse reçue - Status:', response.status);
        
        const result = await response.json();
        console.log('Résultat JSON:', result);
        
        if (result.success) {
            showNotification('Docking moléculaire réussi!', 'success');
            displayDockingResults(result);
            updateDockingHistory();
            
            // Lancer la visualisation 3D si disponible
            if (result.pose_data) {
                initDocking3DVisualization(result.pose_data);
            }
        } else {
            showNotification(`Erreur: ${result.error}`, 'error');
            displayDockingError(result.error);
        }
    } catch (error) {
        console.error('Erreur docking:', error);
        showNotification('Erreur de connexion au serveur', 'error');
        displayDockingError('Erreur réseau');
    } finally {
        dockingInProgress = false;
        showDockingProgress(false);
        disableDockingControls(false);
    }
}

// Valider le format SMILES (validation basique)
function validateSmiles(smiles) {
    if (!smiles || smiles.length < 1) return false;
    
    // Validation simple: caractères chimiques autorisés
    const validChars = /^[CNOPSFClBrI\[\]\(\)=#\/\\@\+\-\.\*]+$/;
    return validChars.test(smiles);
}

// Afficher la progression du docking
function showDockingProgress(show) {
    const progressDiv = document.getElementById('dockingProgress');
    const resultsDiv = document.getElementById('dockingResults');
    
    if (show) {
        progressDiv.classList.remove('hidden');
        resultsDiv.style.display = 'none';
    } else {
        progressDiv.classList.add('hidden');
        resultsDiv.style.display = 'block';
    }
}

// Activer/désactiver les contrôles
function disableDockingControls(disable) {
    const startBtn = document.getElementById('startDockingBtn');
    const select = document.getElementById('dockingAnalysisSelect');
    const ligandInput = document.getElementById('ligandSmiles');
    
    if (startBtn) {
        startBtn.disabled = disable;
        startBtn.textContent = disable ? 'Calcul en cours...' : 'Lancer l\'Amarrage';
    }
    
    if (select) select.disabled = disable;
    if (ligandInput) ligandInput.disabled = disable;
}

// Afficher les résultats du docking
function displayDockingResults(results) {
    const resultsDiv = document.getElementById('dockingResults');
    
    const resultsHTML = `
        <div class="space-y-4">
            <div class="bg-green-900 bg-opacity-30 border border-green-400 p-4 rounded">
                <h4 class="font-bold text-green-400 mb-2">
                    <i class="fas fa-check-circle mr-2"></i>Docking Réussi
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm text-gray-400">Score de Docking:</span>
                        <div class="text-2xl font-bold text-cyan-400">
                            ${results.docking_score ? results.docking_score.toFixed(3) : 'N/A'} kcal/mol
                        </div>
                    </div>
                    <div>
                        <span class="text-sm text-gray-400">Énergie de Liaison:</span>
                        <div class="text-2xl font-bold text-green-400">
                            ${results.binding_energy ? results.binding_energy.toFixed(3) : 'N/A'} kcal/mol
                        </div>
                    </div>
                    <div>
                        <span class="text-sm text-gray-400">Temps d'exécution:</span>
                        <div class="text-lg font-semibold text-yellow-400">
                            ${results.execution_time ? results.execution_time.toFixed(2) : 'N/A'} s
                        </div>
                    </div>
                    <div>
                        <span class="text-sm text-gray-400">Méthode de modélisation:</span>
                        <div class="text-lg font-semibold text-purple-400">
                            ${results.modeling_method || 'modeller'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 bg-opacity-50 p-4 rounded">
                <h4 class="font-bold text-blue-400 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>Informations Scientifiques
                </h4>
                <ul class="text-sm space-y-1">
                    <li>• Séquence protéique analysée: ${currentAnalysisId}</li>
                    <li>• Ligand: ${document.getElementById('ligandSmiles').value}</li>
                    <li>• ID du docking: ${results.docking_id}</li>
                    <li>• Conformité: Spécifications OFFICIELLES Nexora</li>
                    ${results.poses ? `<li>• Nombre de poses: ${results.poses.length}</li>` : ''}
                </ul>
            </div>
            
            <!-- Poses multiples -->
            ${results.poses && results.poses.length > 1 ? `
            <div class="bg-gray-800 bg-opacity-50 p-4 rounded">
                <h4 class="font-bold text-orange-400 mb-3">
                    <i class="fas fa-layer-group mr-2"></i>Poses Multiples (${results.poses.length})
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${results.poses.map((pose, index) => `
                        <div class="bg-gray-700 p-3 rounded border ${index === 0 ? 'border-green-400' : 'border-gray-600'}">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold ${index === 0 ? 'text-green-400' : 'text-gray-300'}">
                                    Pose ${pose.pose_id || index + 1}
                                    ${index === 0 ? ' (Meilleure)' : ''}
                                </span>
                                <span class="text-xs text-cyan-400">
                                    ${pose.score ? pose.score.toFixed(3) : 'N/A'} kcal/mol
                                </span>
                            </div>
                            <button onclick="visualizePose(${index})" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">
                                <i class="fas fa-eye mr-1"></i>Voir 3D
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Interactions -->
            ${results.interactions ? `
            <div class="bg-gray-800 bg-opacity-50 p-4 rounded">
                <h4 class="font-bold text-pink-400 mb-3">
                    <i class="fas fa-atom mr-2"></i>Interactions Moléculaires
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-400">
                            ${results.interactions.total_contacts || 0}
                        </div>
                        <div class="text-sm text-gray-400">Contacts totaux</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-400">
                            ${results.interactions.hydrogen_bonds ? results.interactions.hydrogen_bonds.length : 0}
                        </div>
                        <div class="text-sm text-gray-400">Liaisons hydrogène</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-400">
                            ${results.interactions.hydrophobic_contacts ? results.interactions.hydrophobic_contacts.length : 0}
                        </div>
                        <div class="text-sm text-gray-400">Contacts hydrophobes</div>
                    </div>
                </div>
                
                ${results.interactions.hydrogen_bonds && results.interactions.hydrogen_bonds.length > 0 ? `
                    <div class="mt-3">
                        <h5 class="text-sm font-semibold text-green-400 mb-2">Liaisons Hydrogène:</h5>
                        <div class="text-xs space-y-1">
                            ${results.interactions.hydrogen_bonds.map((bond, index) => `
                                <div class="text-gray-300">
                                    ${bond.atom1}-${bond.atom2}: ${bond.distance ? bond.distance.toFixed(2) : 'N/A'} Å
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${results.pose_data || results.poses ? `
            <div class="bg-gray-800 bg-opacity-50 p-4 rounded">
                <h4 class="font-bold text-purple-400 mb-2">
                    <i class="fas fa-cube mr-2"></i>Coordonnées 3D
                </h4>
                <p class="text-sm text-gray-400">
                    ${results.pose_data && results.pose_data.best_pose && results.pose_data.best_pose.atoms ? 
                        results.pose_data.best_pose.atoms.length : 
                        (results.poses && results.poses[0] && results.poses[0].atoms ? results.poses[0].atoms.length : 0)
                    } atomes positionnés
                </p>
            </div>
            ` : ''}
        </div>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
    
    // Stocker les poses pour la visualisation
    if (results.poses) {
        window.allPoses = results.poses;
    }
}

// Visualiser une pose spécifique
function visualizePose(poseIndex) {
    if (!window.allPoses || !window.allPoses[poseIndex]) {
        console.error('Pose non disponible:', poseIndex);
        return;
    }
    
    const pose = window.allPoses[poseIndex];
    console.log('Visualisation de la pose:', pose);
    
    // Utiliser la meilleure pose pour la visualisation 3D
    if (pose.atoms && typeof initDocking3DVisualization === 'function') {
        initDocking3DVisualization({ atoms: pose.atoms });
    }
}

// Afficher une erreur de docking
function displayDockingError(error) {
    const resultsDiv = document.getElementById('dockingResults');
    
    resultsDiv.innerHTML = `
        <div class="bg-red-900 bg-opacity-30 border border-red-400 p-4 rounded">
            <h4 class="font-bold text-red-400 mb-2">
                <i class="fas fa-exclamation-triangle mr-2"></i>Échec du Docking
            </h4>
            <p class="text-red-300">${error}</p>
            <div class="mt-4 text-sm text-gray-400">
                <p>Vérifiez:</p>
                <ul class="list-disc list-inside">
                    <li>La séquence protéique est valide</li>
                    <li>Le format SMILES du ligand est correct</li>
                    <li>Les outils de docking sont installés</li>
                </ul>
            </div>
        </div>
    `;
}

// Mettre à jour l'historique du docking
async function updateDockingHistory() {
    if (!currentAnalysisId) return;
    
    try {
        const response = await fetch(`api.php?action=get_docking_results&analysis_id=${currentAnalysisId}`);
        const data = await response.json();
        
        if (data.success && data.results) {
            console.log('Historique docking mis à jour:', data.results);
        }
    } catch (error) {
        console.error('Erreur mise à jour historique:', error);
    }
}

// Initialiser la visualisation 3D des résultats
function initDocking3DVisualization(poseData) {
    console.log('=== INIT 3D VISUALIZATION ===');
    console.log('poseData reçu:', poseData);
    
    const viewer = document.getElementById('docking3DViewer');
    console.log('Element viewer:', viewer);
    
    if (!viewer) {
        console.error('❌ Element docking3DViewer non trouvé');
        return;
    }
    
    if (!poseData || !poseData.atoms) {
        console.warn(' Aucune donnée 3D disponible');
        viewer.innerHTML = `
            <div class="text-center text-gray-400">
                <i class="fas fa-cube text-4xl mb-4"></i>
                <p>Aucune donnée 3D disponible</p>
            </div>
        `;
        return;
    }
    
    console.log(' Données 3D valides, nombre d\'atomes:', poseData.atoms.length);
    
    try {
        // Vérifier si Three.js est chargé
        if (typeof THREE === 'undefined') {
            console.error('❌ Three.js non chargé');
            viewer.innerHTML = '<div class="text-red-400">Three.js non disponible</div>';
            return;
        }
        
        console.log(' Three.js disponible, création de la scène...');
        
        // Créer la scène Three.js
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        
        const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
        camera.position.z = 30; // Plus proche pour bien voir
        
        console.log(' Caméra créée');
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(viewer.clientWidth, viewer.clientHeight);
        viewer.innerHTML = '';
        viewer.appendChild(renderer.domElement);
        
        console.log(' Renderer créé et ajouté');
        
        // Créer les molécules
        const moleculeGroup = new THREE.Group();
        
        // Déclarer controls en dehors du if
        let controls = null;
        
        // Ajouter les contrôles
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            console.log(' Contrôles Orbit créés');
        } else {
            console.warn(' OrbitControls non disponible');
        }
        
        poseData.atoms.forEach((atom, index) => {
            console.log(`Création de l'atome ${index}:`, atom);
            
            // Taille raisonnable pour les atomes
            const geometry = new THREE.SphereGeometry(1.5, 32, 32);
            let material;
            
            // Couleur selon le type d'atome
            switch (atom.element.toUpperCase()) {
                case 'C':
                    material = new THREE.MeshPhongMaterial({ color: 0x404040 });
                    break;
                case 'N':
                    material = new THREE.MeshPhongMaterial({ color: 0x3050f8 });
                    break;
                case 'O':
                    material = new THREE.MeshPhongMaterial({ color: 0xff0d0d });
                    break;
                case 'S':
                    material = new THREE.MeshPhongMaterial({ color: 0xffff30 });
                    break;
                default:
                    material = new THREE.MeshPhongMaterial({ color: 0x808080 });
            }
            
            const sphere = new THREE.Mesh(geometry, material);
            
            // Positionnement simple sans facteur d'échelle excessif
            sphere.position.set(
                atom.x * 2, // Simple mise à l'échelle
                atom.y * 2,
                atom.z * 2
            );
            
            moleculeGroup.add(sphere);
        });
        
        console.log(' Molécule créée avec', poseData.atoms.length, 'atomes');
        
        // Ajouter des liaisons entre atomes proches
        if (poseData.atoms.length >= 2) {
            for (let i = 0; i < poseData.atoms.length - 1; i++) {
                const atom1 = poseData.atoms[i];
                const atom2 = poseData.atoms[i + 1];
                
                // Calculer la distance
                const distance = Math.sqrt(
                    Math.pow(atom2.x - atom1.x, 2) +
                    Math.pow(atom2.y - atom1.y, 2) +
                    Math.pow(atom2.z - atom1.z, 2)
                );
                
                // Créer une liaison si les atomes sont proches
                if (distance < 2.0) {
                    const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, distance * 2, 8);
                    const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
                    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
                    
                    // Positionner la liaison au milieu
                    bond.position.set(
                        (atom1.x + atom2.x) * 1,
                        (atom1.y + atom2.y) * 1,
                        (atom1.z + atom2.z) * 1
                    );
                    
                    // Orienter la liaison
                    bond.lookAt(new THREE.Vector3(
                        atom2.x * 2,
                        atom2.y * 2,
                        atom2.z * 2
                    ));
                    
                    moleculeGroup.add(bond);
                }
            }
        }
        
        scene.add(moleculeGroup);
        
        // Ajouter la lumière
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        console.log(' Lumière ajoutée');
        
        // Animation
        function animate() {
            requestAnimationFrame(animate);
            if (controls) controls.update();
            moleculeGroup.rotation.y += 0.005;
            renderer.render(scene, camera);
        }
        
        console.log(' Démarrage de l\'animation...');
        animate();
        
        // Gérer le redimensionnement
        window.addEventListener('resize', () => {
            camera.aspect = viewer.clientWidth / viewer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(viewer.clientWidth, viewer.clientHeight);
        });
        
        console.log(' Visualisation 3D initialisée avec succès!');
        
    } catch (error) {
        console.error(' Erreur lors de l\'initialisation 3D:', error);
        viewer.innerHTML = `<div class="text-red-400">Erreur 3D: ${error.message}</div>`;
    }
}

// Effacer les résultats du docking
function clearDockingResults() {
    const resultsDiv = document.getElementById('dockingResults');
    const viewer = document.getElementById('docking3DViewer');
    
    resultsDiv.innerHTML = `
        <div class="text-center text-gray-400 mt-20">
            <i class="fas fa-atom text-4xl mb-4"></i>
            <p>Aucun résultat de docking♣</p>
            <p class="text-sm mt-2">Lancez un amarrage pour voir les résultats</p>
        </div>
    `;
    
    viewer.innerHTML = `
        <div class="text-center text-gray-400">
            <i class="fas fa-cube text-4xl mb-4"></i>
            <p>Visualisation 3D disponible après docking</p>
        </div>
    `;
    
    showNotification('Résultats effacés', 'info');
}

// Fonction de notification
function showNotification(message, type) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        'bg-blue-600'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur l'onglet docking
    if (document.getElementById('docking')) {
        console.log('Page chargée, initialisation docking...');
        initDockingModule();
    }
});

// Réinitialiser quand l'onglet docking est affiché
function onDockingTabShow() {
    console.log('Onglet docking affiché, réinitialisation...');
    initDockingModule();
}

// Exporter les fonctions pour l'utilisation globale
window.startDocking = startDocking;
window.clearDockingResults = clearDockingResults;
window.initDockingModule = initDockingModule;
window.loadDockingAnalyses = loadDockingAnalyses;
window.onDockingTabShow = onDockingTabShow;
