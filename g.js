// ==========================================
// COMPATIBILITÉ AVEC LES ANCIENS APPELS GLOBAUX
// ==========================================

// Attendre que les modules soient chargés
document.addEventListener('DOMContentLoaded', function() {
    // Délai pour s'assurer que les modules sont chargés
    setTimeout(function() {
        // Fonctions de compatibilité pour les anciens appels
        window.updateProgressStep = function(step, status, message) {
            if (typeof nexoraApp !== 'undefined' && nexoraApp.emit) {
                nexoraApp.emit('progress:update', { step, status, message });
            }
        };

        window.showNotification = function(message, type = 'info', duration = 5000) {
            if (typeof nexoraApp !== 'undefined' && nexoraApp.emit) {
                nexoraApp.emit('notification:show', { message, type, duration });
            }
        };

        console.log(' Compatibilité anciens appels activée');
    }, 100);
});

// ==========================================
// ANCIEN CODE G.JS (PRÉSERVÉ)
// ==========================================





// Variables globales 
let dnaScene, dnaCamera, dnaRenderer, dnaModel;
let proteinScene, proteinCamera, proteinRenderer, proteinModel;
let nucleotideChart, rnaChart, resistanceChart, aminoAcidChart, complexityChart, ncbiStatsChart;
let currentSequence = '';
let currentReference = '';
let currentRNA = '';
let currentProtein = '';
let mutations = [];
let analysisHistory = [];
let currentUser = null;
let currentProject = null;
let ncbiCache = new Map();
let aiInterpretations = {};

// Variables FASTA et NCBI
let currentFastaFile = null;
let currentFastaSequences = [];
let ncbiSearchHistory = [];
let fastaSequences = []



// Tableau du code génétique
const geneticCode = {
    'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
    'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
    'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*',
    'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W',
    'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
    'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M',
    'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
    'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

const aminoAcidProperties = {
    'A': { name: 'Alanine', mass: 89.1, type: 'hydrophobic' },
    'R': { name: 'Arginine', mass: 174.2, type: 'charged' },
    'N': { name: 'Asparagine', mass: 132.1, type: 'polar' },
    'D': { name: 'Aspartic acid', mass: 133.1, type: 'charged' },
    'C': { name: 'Cysteine', mass: 121.0, type: 'polar' },
    'E': { name: 'Glutamic acid', mass: 147.1, type: 'charged' },
    'Q': { name: 'Glutamine', mass: 146.1, type: 'polar' },
    'G': { name: 'Glycine', mass: 75.1, type: 'hydrophobic' },
    'H': { name: 'Histidine', mass: 155.2, type: 'charged' },
    'I': { name: 'Isoleucine', mass: 131.2, type: 'hydrophobic' },
    'L': { name: 'Leucine', mass: 131.2, type: 'hydrophobic' },
    'K': { name: 'Lysine', mass: 146.2, type: 'charged' },
    'M': { name: 'Methionine', mass: 149.2, type: 'hydrophobic' },
    'F': { name: 'Phenylalanine', mass: 165.2, type: 'hydrophobic' },
    'P': { name: 'Proline', mass: 115.1, type: 'hydrophobic' },
    'S': { name: 'Serine', mass: 105.1, type: 'polar' },
    'T': { name: 'Threonine', mass: 119.1, type: 'polar' },
    'W': { name: 'Tryptophan', mass: 204.2, type: 'hydrophobic' },
    'Y': { name: 'Tyrosine', mass: 181.2, type: 'polar' },
    'V': { name: 'Valine', mass: 117.1, type: 'hydrophobic' }
};

// Données scientifiques pour chaque antibiotique
const antibioticData = {
    penicillin: { target: "Paroi bactérienne (PBPs)", mechanism: "β-lactamase", relatedMutations: [2, 5, 15, 22, 35] },
    tetracycline: { target: "Sous-unité ribosomale 30S", mechanism: "Pompe d'efflux / Protection ribosomale", relatedMutations: [7, 12, 18, 22, 30] },
    chloramphenicol: { target: "Sous-unité ribosomale 50S", mechanism: "Acétyltransférase", relatedMutations: [3, 10, 20, 25, 38] },
    streptomycin: { target: "Sous-unité ribosomale 30S", mechanism: "Modification enzymatique", relatedMutations: [1, 5, 14, 22, 39] },
    rifampicin: { target: "ARN polymérase", mechanism: "Modification de la cible", relatedMutations: [4, 11, 23, 27, 36] },
    vancomycin: { target: "Paroi bactérienne (D-Ala-D-Ala)", mechanism: "Modification de la cible", relatedMutations: [6, 15, 28, 34, 40] }
};

//Ampicilne, Gentamicin,Ciproflaxine,Erythromycine, Trimethoprim


// ==========================================
// INITIALISATION PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de N3XORA Platforme...');
    
    initializeAll();
    loadUserData();
    setupEventListeners();
    
    // Séquences d'exemple étendues
    const sampleSequences = {
        dna: 'ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGAACGTACGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCCTGATGCGGTATTTTCTCCTTACGCATCTGTGCGGTATTTCACACCGCATATGGTGCACTCTCAGTACAATCTGCTCTGATGCCGCATAGTTAAGCCAGCCCCGACACCCGCCAACACCCGCTGACGCGCCCTGACGGGCTTGTCTGCTCCCGGCATCCGCTTACAGACAAGCTGTGACCGTCTCCGGGAGCTGCATGTGTCAGAGGTTTTCACCGTCATCACCGAAACGCGCGA',
        reference: 'ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGAACGTACGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCCTGATGCGGTATTTTCTCCTTACGCATCTGTGCGGTATTTCACACCGCATATGGTGCACTCTCAGTACAATCTGCTCTGATGCCGCATAGTTAAGCCAGCCCCGACACCCGCCAACACCCGCTGACGCGCCCTGACGGGCTTGTCTGCTCCCGGCATCCGCTTACAGACAAGCTGTGACCGTCTCCGGGAGCTGCATGTGTCAGAGGTTTTCACCGTCATCACCGAAACGCGCGA'
    };
    
    document.getElementById('sequenceInput').value = sampleSequences.dna;
    document.getElementById('referenceInput').value = sampleSequences.reference;
    
    // Analyse initiale automatique
    setTimeout(() => {
        analyzeSequence();
        showNotification(' Plateforme initialisée avec succès!', 'success');
    }, 1000);
});

function initializeAll() {
    initializeMatrixBackground();
    initializeDNAVisualization();
    initializeProteinVisualization();
    initializeCharts();
    initializeFASTAUploader();
    initializeNCBIConnector();
    initializeAIAssistant();
    startDataStream();
    createFloatingParticles();
    setupAdvancedFeatures();
}

   // Gestion des onglets avec clic
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Initialiser le module docking si l'onglet docking est affiché
            if (tabName === 'docking' && typeof onDockingTabShow === 'function') {
                setTimeout(() => {
                    onDockingTabShow();
                }, 100);
            }
        }

// ==========================================
// GESTION FASTA UPLOAD
// ==========================================

function initializeFASTAUploader() {
    // Créer l'interface d'upload FASTA
    const uploadHTML = `
        <div class="hologram p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-file-upload mr-2"></i>
                Upload Fichier FASTA
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <div class="border-2 border-dashed border-cyan-400 rounded-lg p-6 text-center cursor-pointer hover:border-magenta-400 transition-colors" 
                         id="fastaDropZone">
                        <i class="fas fa-cloud-upload-alt text-4xl text-cyan-400 mb-4"></i>
                        <p class="text-cyan-400 mb-2">Glissez votre fichier FASTA ici</p>
                        <p class="text-gray-400 text-sm">ou cliquez pour sélectionner</p>
                       <input type="file" id="fastaFile" accept=".fasta,.fa,.fas,.fna,.txt" style="display: none;">
                    </div>
                    <div class="mt-4">
                        <button onclick="uploadFastaFile()" class="btn-cyber w-full">
                            <i class="fas fa-upload mr-2"></i>
                            Analyser Fichier FASTA
                        </button>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-3 text-cyan-400">Informations du fichier</h4>
                    <div id="fastaFileInfo" class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Fichier:</span>
                            <span id="fastaFileName" class="text-cyan-400">Aucun</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Taille:</span>
                            <span id="fastaFileSize" class="text-cyan-400">0 KB</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Séquences:</span>
                            <span id="fastaSequenceCount" class="text-cyan-400">0</span>
                        </div>
                    </div>
                    <div id="fastaPreview" class="mt-4 p-3 bg-black bg-opacity-50 rounded border border-cyan-400 max-h-40 overflow-y-auto text-sm font-mono">
                        <p class="text-gray-400">Prévisualisation du fichier FASTA...</p>
                    </div>
                </div>
            </div>
        </div>
    `;


    // AJOUTER cette initialisation dans votre fonction initializeFASTAUploader ou au chargement :
document.addEventListener('DOMContentLoaded', function() {
    // Gestionnaire pour l'input file
    const fastaFileInput = document.getElementById('fastaFile');
    if (fastaFileInput) {
        fastaFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                processFastaFile(e.target.files[0]);
            }
        });
    }
    
    // Gestionnaire pour le bouton de parcours
    const browseButton = document.querySelector('button[onclick*="fastaFile"]');
    if (browseButton) {
        browseButton.onclick = function() {
            document.getElementById('fastaFile').click();
        };
    }
});
    
    // Insérer l'interface avant le premier onglet
    const firstTab = document.getElementById('dna');
    firstTab.insertAdjacentHTML('afterbegin', uploadHTML);
    
    // Configuration des événements de drag & drop
    const dropZone = document.getElementById('fastaDropZone');
    const fileInput = document.getElementById('fastaFileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-magenta-400', 'bg-cyan-400', 'bg-opacity-10');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-magenta-400', 'bg-cyan-400', 'bg-opacity-10');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-magenta-400', 'bg-cyan-400', 'bg-opacity-10');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFastaFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFastaFile(file);
    }
}


function processFastaFile(file) {
    // Si aucun fichier n'est fourni, prendre celui de l'input
    if (!file) {
        const fileInput = document.getElementById('fastaFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            showNotification('Veuillez d\'abord sélectionner un fichier FASTA', 'error');
            return;
        }
        file = fileInput.files[0];
    }
    
    // Validation du fichier
    if (!validateFastaFile(file)) {
        return;
    }
    
    // Afficher les informations du fichier
    updateFileInfo(file);
    
    // Lire et traiter le fichier
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const sequences = parseFastaContent(content);
            
            if (sequences.length > 0) {
                fastaSequences = sequences;
                displayFastaPreview(sequences);
                document.getElementById('processBtn').disabled = false;
                showNotification(`${sequences.length} séquence(s) chargée(s) avec succès`, 'success');
            } else {
                showNotification('Aucune séquence valide trouvée dans le fichier', 'error');
                clearFastaPreview();
            }
        } catch (error) {
            console.error('Erreur traitement FASTA:', error);
            showNotification('Erreur lors du traitement du fichier', 'error');
            clearFastaPreview();
        }
    };
    
    reader.onerror = function() {
        showNotification('Erreur lors de la lecture du fichier', 'error');
    };
    
    reader.readAsText(file);
}

// AJOUTER ces fonctions de validation et utilitaires :
function validateFastaFile(file) {
    const allowedExtensions = ['fasta', 'fa', 'fas', 'fna', 'txt'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
        showNotification(`Extension non supportée. Utilisez: ${allowedExtensions.join(', ')}`, 'error');
        return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB max
        showNotification('Fichier trop volumineux (max: 50MB)', 'error');
        return false;
    }
    
    if (file.size === 0) {
        showNotification('Le fichier est vide', 'error');
        return false;
    }
    
    return true;
}

function updateFileInfo(file) {
    // Mettre à jour les informations du fichier dans l'interface
    const fileName = document.getElementById('fastaFileName');
    const fileSize = document.getElementById('fastaFileSize');
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
}

function clearFastaPreview() {
    const preview = document.getElementById('fastaPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="text-center text-gray-400 mt-20">
                <i class="fas fa-file-alt text-4xl mb-4"></i>
                <p>Erreur lors du traitement du fichier</p>
            </div>
        `;
    }
    document.getElementById('processBtn').disabled = false;
}

function parseFastaContent(content) {
    console.log('Parsing FASTA content, length:', content.length);
    
    if (!content || content.trim().length === 0) {
        throw new Error('Contenu du fichier vide');
    }
    
    const sequences = [];
    const lines = content.split(/\r?\n/); // Support Windows et Unix line endings
    let currentSequence = null;
    let lineNumber = 0;
    
    for (let line of lines) {
        lineNumber++;
        line = line.trim();
        
        // Ignorer les lignes vides
        if (line.length === 0) continue;
        
        if (line.startsWith('>')) {
            // Sauvegarder la séquence précédente si elle existe
            if (currentSequence && currentSequence.sequence.length > 0) {
                sequences.push(currentSequence);
            }
            
            // Nouvelle séquence
            currentSequence = {
                header: line.substring(1), // Enlever le '>'
                sequence: '',
                length: 0,
                lineStart: lineNumber
            };
            
            console.log('Nouvelle séquence trouvée:', currentSequence.header);
            
        } else if (currentSequence) {
            // Nettoyer la ligne de séquence
            const cleanLine = line.toUpperCase().replace(/[^ATCGRYKMSWBDHVNU]/g, '');
            
            if (cleanLine.length !== line.length) {
                console.warn(`Ligne ${lineNumber}: caractères non-standard supprimés`);
            }
            
            currentSequence.sequence += cleanLine;
            currentSequence.length = currentSequence.sequence.length;
            
        } else if (line.startsWith('>') === false && sequences.length === 0) {
            // Première ligne n'est pas un header FASTA
            throw new Error('Format FASTA invalide: le fichier doit commencer par une ligne d\'en-tête (>)');
        }
    }
    
    // Ajouter la dernière séquence
    if (currentSequence && currentSequence.sequence.length > 0) {
        sequences.push(currentSequence);
    }
    
    console.log(`Parsing terminé: ${sequences.length} séquence(s) trouvée(s)`);
    
    if (sequences.length === 0) {
        throw new Error('Aucune séquence valide trouvée dans le fichier FASTA');
    }
    
    return sequences;
}

// AMÉLIORER votre fonction displayFastaPreview :
function displayFastaPreview(sequences) {
    const preview = document.getElementById('fastaPreview');
    if (!preview) {
        console.error('Element fastaPreview not found');
        return;
    }
    
    console.log('Displaying preview for', sequences.length, 'sequences');
    
    let html = '<div class="space-y-4">';
    
    // Afficher jusqu'à 3 séquences dans l'aperçu
    const previewCount = Math.min(sequences.length, 3);
    
    for (let i = 0; i < previewCount; i++) {
        const seq = sequences[i];
        const shortSequence = seq.sequence.length > 100 ? 
            seq.sequence.substring(0, 100) + '...' : seq.sequence;
        
        html += `
            <div class="border border-cyan-400 rounded-lg p-4 bg-black bg-opacity-30">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-cyan-400 font-bold text-sm">Séquence ${i + 1}</h4>
                    <button onclick="selectFastaSequence(${i}, '${seq.sequence.replace(/'/g, "\\'")}', '${seq.header.replace(/'/g, "\\'")}'); event.stopPropagation();" 
                            class="btn-cyber text-xs">
                        <i class="fas fa-play mr-1"></i>Utiliser
                    </button>
                </div>
                <div class="text-green-400 text-xs mb-2 break-all">
                    &gt;${seq.header.length > 80 ? seq.header.substring(0, 80) + '...' : seq.header}
                </div>
                <div class="font-mono text-xs text-white mb-2 break-all">
                    ${formatSequence(shortSequence, 'dna')}
                </div>
                <div class="flex justify-between text-xs text-gray-400">
                    <span>Longueur: ${seq.length} bp</span>
                    <span>Type: ${detectSequenceType(seq.sequence)}</span>
                </div>
            </div>
        `;
    }
    
    if (sequences.length > 3) {
        html += `
            <div class="text-center text-gray-400 text-sm p-4">
                <i class="fas fa-ellipsis-h mr-2"></i>
                ... et ${sequences.length - 3} autre(s) séquence(s)
                <button onclick="showAllSequences()" class="btn-cyber text-xs ml-4">
                    <i class="fas fa-list mr-1"></i>Voir toutes
                </button>
            </div>
        `;
    }
    
    html += '</div>';
    preview.innerHTML = html;
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('fastaSequenceCount');
    if (countElement) {
        countElement.textContent = sequences.length;
    }
}

// REMPLACER votre fonction processFastaFile par cette version robuste :
function processFastaFile(file) {
    // Si aucun fichier n'est fourni, prendre celui de l'input
    if (!file) {
        const fileInput = document.getElementById('fastaFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            showNotification('Veuillez d\'abord sélectionner un fichier FASTA', 'error');
            return;
        }
        file = fileInput.files[0];
    }
    
    console.log('Processing FASTA file:', file.name, 'Size:', file.size);
    
    // Validation du fichier
    if (!validateFastaFile(file)) {
        return;
    }
    
    // Afficher les informations du fichier
    updateFileInfo(file);
    
    // Afficher un indicateur de chargement
    const preview = document.getElementById('fastaPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="text-center text-cyan-400 py-8">
                <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                <p>Traitement du fichier FASTA en cours...</p>
                <p class="text-sm text-gray-400">${file.name}</p>
            </div>
        `;
    }
    
    // Lire et traiter le fichier avec gestion d'erreur robuste
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            console.log('File read successfully, content length:', e.target.result.length);
            
            const content = e.target.result;
            
            // Vérification de base du contenu
            if (!content || content.trim().length === 0) {
                throw new Error('Le fichier est vide');
            }
            
            if (!content.includes('>')) {
                throw new Error('Format FASTA invalide: aucun header trouvé (pas de ligne commençant par >)');
            }
            
            const sequences = parseFastaContentRobust(content);
            
            if (sequences.length > 0) {
                fastaSequences = sequences;
                displayFastaPreviewEnhanced(sequences);
                document.getElementById('processBtn').disabled = false;
                showNotification(`${sequences.length} séquence(s) chargée(s) avec succès`, 'success');
                
                // Log pour debug
                console.log('Sequences parsed successfully:', sequences);
                
            } else {
                throw new Error('Aucune séquence valide trouvée dans le fichier');
            }
            
        } catch (error) {
            console.error('Erreur traitement FASTA:', error);
            showNotification('Erreur: ' + error.message, 'error');
            clearFastaPreview();
            
            // Afficher des détails de debug dans la preview
            if (preview) {
                preview.innerHTML = `
                    <div class="text-center text-red-400 py-8">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p class="font-bold">Erreur de traitement</p>
                        <p class="text-sm">${error.message}</p>
                        <button onclick="showFileDebugInfo()" class="btn-cyber text-xs mt-4">
                            <i class="fas fa-info-circle mr-1"></i>Voir détails
                        </button>
                    </div>
                `;
            }
        }
    };
    
    reader.onerror = function(error) {
        console.error('File reader error:', error);
        showNotification('Erreur lors de la lecture du fichier', 'error');
        clearFastaPreview();
    };
    
    // Lire le fichier comme texte avec encodage UTF-8
    reader.readAsText(file, 'UTF-8');
}

// Fonction de parsing FASTA plus robuste
function parseFastaContentRobust(content) {
    console.log('Parsing FASTA content...');
    
    const sequences = [];
    const lines = content.split(/\r?\n/);
    let currentSequence = null;
    let lineNumber = 0;
    let totalLines = lines.length;
    
    console.log(`Total lines to process: ${totalLines}`);
    
    for (let line of lines) {
        lineNumber++;
        const originalLine = line;
        line = line.trim();
        
        // Ignorer les lignes vides et commentaires
        if (line.length === 0 || line.startsWith(';')) {
            continue;
        }
        
        if (line.startsWith('>')) {
            // Sauvegarder la séquence précédente
            if (currentSequence && currentSequence.sequence.length > 0) {
                currentSequence.length = currentSequence.sequence.length;
                sequences.push(currentSequence);
                console.log(`Séquence sauvée: ${currentSequence.header.substring(0, 50)}... (${currentSequence.length} bp)`);
            }
            
            // Nouvelle séquence
            currentSequence = {
                id: sequences.length + 1,
                header: line.substring(1).trim(), // Enlever le '>' et espaces
                sequence: '',
                length: 0,
                lineStart: lineNumber,
                type: 'DNA' // Par défaut
            };
            
            console.log(`Nouvelle séquence ligne ${lineNumber}: ${currentSequence.header.substring(0, 50)}...`);
            
        } else if (currentSequence) {
            // Ligne de séquence
            let cleanLine = line.toUpperCase();
            
            // Enlever les caractères non-valides mais garder les ambigus
            const validChars = /[ATCGRYKMSWBDHVNU]/g;
            const validSequence = cleanLine.match(validChars);
            
            if (validSequence) {
                const cleanSequence = validSequence.join('');
                currentSequence.sequence += cleanSequence;
                
                // Détecter le type de séquence
                if (cleanSequence.includes('U')) {
                    currentSequence.type = 'RNA';
                } else if (/[FILVMPWYA]/.test(cleanSequence)) {
                    currentSequence.type = 'Protein';
                }
                
                // Avertir si des caractères ont été supprimés
                if (cleanSequence.length !== cleanLine.length) {
                    const removed = cleanLine.replace(validChars, '').replace(/\s+/g, '');
                    if (removed.length > 0) {
                        console.warn(`Ligne ${lineNumber}: caractères supprimés: "${removed}"`);
                    }
                }
            }
            
        } else {
            // Ligne de séquence sans header
            console.warn(`Ligne ${lineNumber}: séquence trouvée avant un header FASTA`);
        }
        
        // Progress indication pour gros fichiers
        if (lineNumber % 1000 === 0) {
            console.log(`Progression: ${lineNumber}/${totalLines} lignes (${Math.round(lineNumber/totalLines*100)}%)`);
        }
    }
    
    // Ajouter la dernière séquence
    if (currentSequence && currentSequence.sequence.length > 0) {
        currentSequence.length = currentSequence.sequence.length;
        sequences.push(currentSequence);
        console.log(`Dernière séquence sauvée: ${currentSequence.header.substring(0, 50)}... (${currentSequence.length} bp)`);
    }
    
    console.log(`Parsing terminé: ${sequences.length} séquence(s) trouvée(s)`);
    
    // Validation finale
    const validSequences = sequences.filter(seq => seq.sequence.length >= 10);
    if (validSequences.length < sequences.length) {
        console.warn(`${sequences.length - validSequences.length} séquence(s) ignorée(s) (trop courtes < 10 bp)`);
    }
    
    return validSequences;
}

// Fonction d'affichage améliorée
function displayFastaPreviewEnhanced(sequences) {
    const preview = document.getElementById('fastaPreview');
    if (!preview) return;
    
    console.log('Displaying enhanced preview for', sequences.length, 'sequences');
    
    let html = `
        <div class="mb-4 p-3 bg-gray-800 rounded-lg">
            <div class="flex justify-between items-center">
                <span class="font-bold text-cyan-400">
                    <i class="fas fa-dna mr-2"></i>${sequences.length} séquence(s) chargée(s)
                </span>
                <div class="space-x-2">
                    <button onclick="analyzeAllSequences()" class="btn-cyber text-xs">
                        <i class="fas fa-play mr-1"></i>Analyser toutes
                    </button>
                    <button onclick="exportSequences()" class="btn-cyber text-xs">
                        <i class="fas fa-download mr-1"></i>Exporter
                    </button>
                </div>
            </div>
        </div>
        <div class="space-y-3 max-h-80 overflow-y-auto">
    `;
    
    // Statistiques rapides
    const stats = calculateSequenceStats(sequences);
    html += `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-black bg-opacity-30 rounded">
            <div class="text-center">
                <div class="text-cyan-400 font-bold">${stats.totalLength}</div>
                <div class="text-xs text-gray-400">Total bp</div>
            </div>
            <div class="text-center">
                <div class="text-green-400 font-bold">${stats.avgLength}</div>
                <div class="text-xs text-gray-400">Moy. bp</div>
            </div>
            <div class="text-center">
                <div class="text-purple-400 font-bold">${stats.maxLength}</div>
                <div class="text-xs text-gray-400">Max bp</div>
            </div>
            <div class="text-center">
                <div class="text-orange-400 font-bold">${stats.avgGC}%</div>
                <div class="text-xs text-gray-400">Moy. GC</div>
            </div>
        </div>
    `;
    
    // Afficher chaque séquence
    sequences.forEach((seq, index) => {
        const shortSequence = seq.sequence.length > 80 ? 
            seq.sequence.substring(0, 80) + '...' : seq.sequence;
        
        const gcContent = calculateGCContent(seq.sequence);
        
        html += `
            <div class="border border-gray-600 rounded-lg p-4 hover:border-cyan-400 transition-colors bg-black bg-opacity-20">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <h4 class="text-cyan-400 font-bold text-sm flex items-center">
                            <span class="bg-cyan-400 text-black px-2 py-1 rounded-full text-xs mr-2">${index + 1}</span>
                            Séquence ${seq.type}
                        </h4>
                        <p class="text-green-400 text-xs mt-1 break-all">
                            >${seq.header.length > 60 ? seq.header.substring(0, 60) + '...' : seq.header}
                        </p>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="selectAndAnalyzeSequence(${index})" 
                                class="btn-cyber text-xs" title="Analyser cette séquence">
                            <i class="fas fa-play"></i>
                        </button>
                        <button onclick="copySequenceToClipboard(${index})" 
                                class="btn-cyber text-xs" title="Copier la séquence">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="showSequenceDetails(${index})" 
                                class="btn-cyber text-xs" title="Voir les détails">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
                
                <div class="font-mono text-xs text-white mb-3 bg-gray-900 p-2 rounded border-l-2 border-cyan-400">
                    ${formatSequencePreview(shortSequence)}
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div class="text-center bg-gray-800 rounded p-2">
                        <div class="text-cyan-400 font-bold">${seq.length}</div>
                        <div class="text-gray-400">bp</div>
                    </div>
                    <div class="text-center bg-gray-800 rounded p-2">
                        <div class="text-green-400 font-bold">${gcContent.toFixed(1)}%</div>
                        <div class="text-gray-400">GC</div>
                    </div>
                    <div class="text-center bg-gray-800 rounded p-2">
                        <div class="text-purple-400 font-bold">${seq.type}</div>
                        <div class="text-gray-400">Type</div>
                    </div>
                    <div class="text-center bg-gray-800 rounded p-2">
                        <div class="text-orange-400 font-bold" id="analysis-status-${index}">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="text-gray-400">Statut</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    preview.innerHTML = html;
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('fastaSequenceCount');
    if (countElement) {
        countElement.textContent = sequences.length;
    }
}

// AJOUTER cette fonction manquante :
function selectFastaSequence(index, sequence, header) {
    if (index >= 0 && index < fastaSequences.length) {
        const seq = fastaSequences[index];
        
        // Mettre la séquence dans l'analyseur
        document.getElementById('sequenceInput').value = sequence || seq.sequence;
        currentSequence = sequence || seq.sequence;
        
        // Analyser automatiquement
        showNotification(`Séquence "${header || seq.header}" sélectionnée pour analyse`, 'success');
        analyzeSequence();
        
        // Optionnel: changer d'onglet vers l'analyse
        showTab('analysis');
    }
}

function showAllSequences() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    let html = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-list mr-2"></i>
                Toutes les séquences FASTA (${fastaSequences.length})
            </h2>
            <div class="max-h-96 overflow-y-auto space-y-3">
    `;
    
    fastaSequences.forEach((seq, index) => {
        html += `
            <div class="border border-gray-600 rounded p-3 hover:border-cyan-400 transition-colors cursor-pointer"
                 onclick="selectFastaSequence(${index}, '${seq.sequence.replace(/'/g, "\\'")}', '${seq.header.replace(/'/g, "\\'")}'); this.closest('.modal').remove();">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-cyan-400">Séquence ${index + 1}</span>
                    <span class="text-xs text-gray-400">${seq.length} bp</span>
                </div>
                <div class="text-xs text-green-400 mb-2 break-all">
                    ${seq.header.substring(0, 100)}${seq.header.length > 100 ? '...' : ''}
                </div>
                <div class="font-mono text-xs text-gray-300">
                    ${seq.sequence.substring(0, 80)}${seq.sequence.length > 80 ? '...' : ''}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="mt-4 text-center">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-cyber">
                    <i class="fas fa-times mr-2"></i>Fermer
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function showFastaSequenceSelector(sequences) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-list mr-2"></i>
                Sélectionner une séquence à analyser
            </h2>
            <div class="max-h-96 overflow-y-auto">
                ${sequences.map((seq, index) => `
                    <div class="p-3 mb-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                         onclick="selectFastaSequence(${index}, '${seq.sequence.replace(/'/g, "\\'")}')">
                        <div class="font-bold text-cyan-400">${index + 1}. ${seq.header.substring(0, 80)}</div>
                        <div class="text-sm text-gray-400">Longueur: ${seq.length} bp</div>
                        <div class="text-xs font-mono text-green-400 mt-1">
                            ${seq.sequence.substring(0, 100)}${seq.sequence.length > 100 ? '...' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function selectFastaSequence(index, sequence) {
    document.getElementById('sequenceInput').value = sequence;
    document.querySelector('.modal').remove();
    analyzeSequence();
    showNotification(`Analyse de la séquence #${index + 1}`, 'info');
}

// Fonction pour analyser toutes les séquences une par une
async function analyzeAllSequences() {
    if (!fastaSequences || fastaSequences.length === 0) {
        showNotification('Aucune séquence à analyser', 'error');
        return;
    }
    
    const total = fastaSequences.length;
    showNotification(`🚀 Début de l'analyse de ${total} séquence(s)...`, 'info');
    
    // Créer le modal de progression
    const progressModal = createAnalysisProgressModal(total);
    document.body.appendChild(progressModal);
    
    const results = [];
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < fastaSequences.length; i++) {
        const sequence = fastaSequences[i];
        
        try {
            updateProgressModal(i + 1, total, `Analyse de: ${sequence.header.substring(0, 50)}...`);
            updateSequenceStatus(i, 'analyzing');
            
            // Analyser la séquence
            const analysisResult = await analyzeSingleSequence(sequence, i);
            
            if (analysisResult.success) {
                results.push(analysisResult);
                successful++;
                updateSequenceStatus(i, 'success');
            } else {
                failed++;
                updateSequenceStatus(i, 'error');
            }
            
            // Pause pour éviter de surcharger le système
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Erreur analyse séquence ${i}:`, error);
            failed++;
            updateSequenceStatus(i, 'error');
        }
    }
    
    // Fermer le modal de progression
    setTimeout(() => {
        progressModal.remove();
        
        // Afficher les résultats
        showAnalysisResults(results, successful, failed);
        showNotification(`Analyse terminée: ${successful} réussies, ${failed} échecs`, 'success');
        
    }, 1000);
}

async function analyzeSingleSequence(sequenceObj, index) {
    return new Promise(async (resolve) => {
        try {
            const sequence = sequenceObj.sequence;
            const reference = sequence; // Utiliser la séquence comme référence par défaut
            
            // Analyses de base
            const basicAnalysis = {
                id: index,
                sequence_name: `${sequenceObj.header} (Auto-${index + 1})`,
                original_sequence: sequence,
                sequence_length: sequence.length,
                sequence_type: sequenceObj.type,
                gc_content: calculateGCContent(sequence),
                timestamp: new Date().toISOString()
            };
            
            // Analyse des nucléotides
            const nucleotideData = analyzeNucleotides(sequence);
            
            // Détection de mutations (comparaison avec une référence générique)
            const mutations = detectMutationsInSequence(sequence, reference);
            
            // Transcription et traduction
            const transcriptionData = transcribeAndTranslateSequence(sequence);
            
            // Analyse de complexité
            const complexity = calculateSequenceComplexity(sequence);
            
            // Prédiction de résistance (simulation)
            const resistanceData = predictResistanceProfile(sequence);
            
            const result = {
                success: true,
                sequence_index: index,
                basic_analysis: basicAnalysis,
                nucleotide_composition: nucleotideData,
                mutations: mutations,
                transcription: transcriptionData,
                complexity_score: complexity,
                resistance_prediction: resistanceData,
                analysis_time: new Date().toISOString()
            };
            
            // Sauvegarder dans l'historique
            addToAnalysisHistory(result, `analysis_${index}_${Date.now()}`);
            
            resolve(result);
            
        } catch (error) {
            resolve({
                success: false,
                sequence_index: index,
                error: error.message
            });
        }
    });
}

// Fonctions utilitaires pour l'analyse individuelle
function calculateSequenceStats(sequences) {
    const lengths = sequences.map(s => s.sequence.length);
    const gcContents = sequences.map(s => calculateGCContent(s.sequence));
    
    return {
        totalLength: lengths.reduce((a, b) => a + b, 0),
        avgLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
        maxLength: Math.max(...lengths),
        minLength: Math.min(...lengths),
        avgGC: Math.round(gcContents.reduce((a, b) => a + b, 0) / gcContents.length * 10) / 10
    };
}

function calculateGCContent(sequence) {
    const gcCount = (sequence.match(/[GC]/g) || []).length;
    return (gcCount / sequence.length) * 100;
}

function formatSequencePreview(sequence) {
    return sequence.replace(/(.{10})/g, '$1 ').trim();
}

function updateSequenceStatus(index, status) {
    const statusElement = document.getElementById(`analysis-status-${index}`);
    if (statusElement) {
        const icons = {
            'analyzing': '<i class="fas fa-spinner fa-spin text-yellow-400"></i>',
            'success': '<i class="fas fa-check text-green-400"></i>',
            'error': '<i class="fas fa-times text-red-400"></i>',
            'pending': '<i class="fas fa-clock text-gray-400"></i>'
        };
        statusElement.innerHTML = icons[status] || icons.pending;
    }
}

function createAnalysisProgressModal(total) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.id = 'batchAnalysisModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-cogs mr-2"></i>
                Analyse en lot - ${total} séquences
            </h2>
            <div class="mb-4">
                <div class="w-full bg-gray-700 rounded-full h-4">
                    <div id="batchProgress" class="bg-gradient-to-r from-cyan-400 to-purple-400 h-4 rounded-full transition-all duration-500" 
                         style="width: 0%"></div>
                </div>
                <div class="flex justify-between mt-2 text-sm">
                    <span id="progressText">Démarrage...</span>
                    <span id="progressCount">0 / ${total}</span>
                </div>
            </div>
            <div id="currentSequenceInfo" class="text-sm text-gray-400 bg-gray-800 p-3 rounded">
                Préparation de l'analyse...
            </div>
        </div>
    `;
    
    return modal;
}

function updateProgressModal(current, total, message) {
    const progress = document.getElementById('batchProgress');
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    const currentInfo = document.getElementById('currentSequenceInfo');
    
    if (progress) {
        const percentage = (current / total) * 100;
        progress.style.width = percentage + '%';
    }
    
    if (progressText) progressText.textContent = `Séquence ${current} sur ${total}`;
    if (progressCount) progressCount.textContent = `${current} / ${total}`;
    if (currentInfo) currentInfo.textContent = message;
}

function showAnalysisResults(results, successful, failed) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    let html = `
        <div class="modal-content" style="max-width: 1000px; max-height: 80vh;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-chart-bar mr-2"></i>
                Résultats de l'analyse en lot
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-green-600 bg-opacity-20 border border-green-400 rounded p-4 text-center">
                    <div class="text-2xl font-bold text-green-400">${successful}</div>
                    <div class="text-sm">Réussies</div>
                </div>
                <div class="bg-red-600 bg-opacity-20 border border-red-400 rounded p-4 text-center">
                    <div class="text-2xl font-bold text-red-400">${failed}</div>
                    <div class="text-sm">Échecs</div>
                </div>
                <div class="bg-blue-600 bg-opacity-20 border border-blue-400 rounded p-4 text-center">
                    <div class="text-2xl font-bold text-blue-400">${results.length}</div>
                    <div class="text-sm">Total</div>
                </div>
            </div>
            
            <div class="max-h-96 overflow-y-auto">
    `;
    
    results.forEach((result, index) => {
        if (result.success) {
            html += `
                <div class="border border-gray-600 rounded p-4 mb-3 hover:border-cyan-400 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-cyan-400">Séquence ${result.sequence_index + 1}</h4>
                        <button onclick="viewDetailedResults(${index})" class="btn-cyber text-xs">
                            <i class="fas fa-eye mr-1"></i>Détails
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>Longueur: <span class="text-cyan-400">${result.basic_analysis.sequence_length} bp</span></div>
                        <div>GC: <span class="text-green-400">${result.basic_analysis.gc_content.toFixed(1)}%</span></div>
                        <div>Mutations: <span class="text-yellow-400">${result.mutations.length}</span></div>
                        <div>Complexité: <span class="text-purple-400">${(result.complexity_score * 100).toFixed(1)}%</span></div>
                    </div>
                </div>
            `;
        }
    });
    
    html += `
            </div>
            <div class="mt-4 flex justify-end space-x-4">
                <button onclick="exportBatchResults()" class="btn-cyber">
                    <i class="fas fa-download mr-2"></i>Exporter résultats
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-cyber">
                    <i class="fas fa-times mr-2"></i>Fermer
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
}

// Fonctions additionnelles
function selectAndAnalyzeSequence(index) {
    if (fastaSequences[index]) {
        const seq = fastaSequences[index];
        document.getElementById('sequenceInput').value = seq.sequence;
        currentSequence = seq.sequence;
        
        showNotification(`Analyse de: ${seq.header.substring(0, 50)}...`, 'info');
        showTab('analysis');
        analyzeSequence();
    }
}

function copySequenceToClipboard(index) {
    if (fastaSequences[index]) {
        const seq = fastaSequences[index];
        navigator.clipboard.writeText(seq.sequence).then(() => {
            showNotification('Séquence copiée dans le presse-papier', 'success');
        });
    }
}

function showSequenceDetails(index) {
    if (fastaSequences[index]) {
        const seq = fastaSequences[index];
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2 class="text-xl font-bold mb-4 text-cyan-400">Détails de la séquence ${index + 1}</h2>
                <div class="space-y-4">
                    <div>
                        <h3 class="font-bold text-green-400">En-tête:</h3>
                        <p class="text-sm bg-gray-800 p-2 rounded break-all">${seq.header}</p>
                    </div>
                    <div>
                        <h3 class="font-bold text-purple-400">Informations:</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>Longueur: ${seq.length} bp</div>
                            <div>Type: ${seq.type}</div>
                            <div>GC Content: ${calculateGCContent(seq.sequence).toFixed(1)}%</div>
                            <div>Complexité: ${(calculateSequenceComplexity(seq.sequence) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-bold text-cyan-400">Séquence complète:</h3>
                        <div class="sequence-viewer h-40 overflow-y-auto text-xs font-mono">
                            ${formatSequence(seq.sequence, 'dna')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

function showFileDebugInfo() {
    const fileInput = document.getElementById('fastaFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('=== DEBUG FILE INFO ===');
        console.log('Name:', file.name);
        console.log('Size:', file.size);
        console.log('Type:', file.type);
        console.log('Last modified:', new Date(file.lastModified));
        
        showNotification(`Fichier: ${file.name}, Taille: ${formatFileSize(file.size)}`, 'info');
    }
}


function clearFastaFile() {
    document.getElementById('fastaPreview').innerHTML = '<p class="text-gray-400">Aucun fichier sélectionné</p>';
    document.getElementById('processBtn').disabled = true;
    window.currentFastaFile = null;
    window.currentFastaSequences = [];
}

// ==========================================
// CONNEXION NCBI
// ==========================================

function initializeNCBIConnector() {
    const ncbiHTML = `
        <div class="hologram p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-database mr-2"></i>
                Recherche NCBI
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-2">
                    <div class="flex gap-4 mb-4">
                        <input type="text" id="ncbiQuery" 
                               class="flex-1 p-3 bg-black bg-opacity-50 border border-cyan-400 rounded text-cyan-400"
                               placeholder="Rechercher par gène, organisme, ou numéro d'accession...">
                        <select id="ncbiDatabase" class="p-3 bg-gray-800 border border-cyan-400 rounded text-white">
                            <option value="nucleotide">Nucléotides</option>
                            <option value="protein">Protéines</option>
                            <option value="pubmed">Publications</option>
                        </select>
                        <button onclick="searchNCBI()" class="btn-cyber">
                            <i class="fas fa-search mr-2"></i>
                            Rechercher
                        </button>
                    </div>
                    <div id="ncbiResults" class="max-h-80 overflow-y-auto space-y-2"></div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-3 text-cyan-400">Raccourcis</h4>
                    <div class="space-y-2">
                        <button onclick="quickNCBISearch('COVID-19')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-virus mr-2"></i>COVID-19
                        </button>
                        <button onclick="quickNCBISearch('insulin human')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-syringe mr-2"></i>Insuline
                        </button>
                        <button onclick="quickNCBISearch('p53 tumor suppressor')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-shield-alt mr-2"></i>p53
                        </button>
                        <button onclick="quickNCBISearch('16S ribosomal RNA')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-dna mr-2"></i>16S rRNA
                        </button>
                    </div>
                    <div class="mt-4 p-3 bg-black bg-opacity-30 rounded">
                        <h5 class="font-semibold text-green-400 mb-2">Recherches récentes</h5>
                        <div id="recentNCBISearches" class="text-sm space-y-1"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insérer après l'upload FASTA
    const fastaSection = document.querySelector('.hologram');
    fastaSection.insertAdjacentHTML('afterend', ncbiHTML);
    
    // Event listeners
    document.getElementById('ncbiQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchNCBI();
        }
    });
    loadRecentNCBISearches();
}


// 🔹 Recherche NCBI
async function searchNCBI() {
    const query = document.getElementById('ncbiQuery').value.trim();
    const database = document.getElementById('ncbiDatabase').value;
    const limit = document.getElementById('ncbiLimit')?.value || 20;
    const organism = document.getElementById('ncbiOrganism')?.value || '';

    if (!query) {
        alert('Veuillez entrer un terme de recherche');
        return;
    }

    const resultsContainer = document.getElementById('ncbiResults');
    resultsContainer.innerHTML = `
        <div class="text-center text-cyan-400 py-8">
            <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
            <p>Recherche en cours...</p>
        </div>
    `;

    try {
        const url = `api.php?action=search_ncbi&query=${encodeURIComponent(query)}&database=${encodeURIComponent(database)}&limit=${limit}&organism=${encodeURIComponent(organism)}`;
        console.log('URL NCBI:', url);

        const response = await fetch(url);
        const result = await response.json();

        console.log('Résultat NCBI:', result);

        // ✅ Vérifications renforcées
        if (!result.success || !Array.isArray(result.results) || result.results.length === 0) {
            resultsContainer.innerHTML = '<div class="text-yellow-400 text-center py-4">Aucun résultat trouvé</div>';
            return;
        }

        const validResults = result.results.filter(item => item.accession && item.title && item.organism);
        if (validResults.length === 0) {
            resultsContainer.innerHTML = '<div class="text-yellow-400 text-center py-4">Aucun résultat valide trouvé</div>';
            return;
        }

        const html = validResults.map(item => `
            <div class="p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                 onclick="fetchNCBISequence('${item.accession}', '${database}', '${item.title.replace(/'/g, "\\'")}', '${item.organism.replace(/'/g, "\\'")}', ${item.length || 0})">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-cyan-400">${item.accession}</span>
                    <span class="text-xs text-green-400">${item.length || 0} bp</span>
                </div>
                <div class="text-sm text-white mb-1">${item.title}</div>
                <div class="text-xs text-gray-400">
                    <span class="mr-4"><i class="fas fa-microscope mr-1"></i>${item.organism}</span>
                    <span><i class="fas fa-calendar mr-1"></i>${item.update_date || 'N/A'}</span>
                </div>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
        saveRecentNCBISearch(query, database);

    } catch (err) {
        console.error('Erreur NCBI:', err);
        resultsContainer.innerHTML = `<div class="text-red-400 text-center py-4">Erreur: ${err.message}</div>`;
    }
}




// 🔹 Récupération de la séquence et affichage modal
async function fetchNCBISequence(accession, database, title='', organism='', length=0) {
    try {
        const url = `api.php?action=fetch_ncbi_sequence&accession=${encodeURIComponent(accession)}&database=${encodeURIComponent(database)}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.success || !result.data) {
            alert('Impossible de récupérer la séquence NCBI');
            return;
        }

        const sequence = result.data.sequence_data.replace(/\s/g, '').toUpperCase();

        // Affiche le modal avec toutes les infos
        showNCBIMetadata({
            sequence_data: sequence,
            gene_name: result.data.gene_name || 'Non spécifié',
            organism: organism || 'Non spécifié',
            title: title
        }, accession);
    } catch (err) {
        console.error('Erreur récupération séquence:', err);
        alert('Erreur lors de la récupération de la séquence');
    }
}

function showNCBIMetadata(data, accession) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-info-circle mr-2"></i>
                Métadonnées NCBI - ${accession}
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-bold text-green-400 mb-2">Informations générales</h3>
                    <div class="space-y-2 text-sm">
                        <div><strong>Accession:</strong> ${accession}</div>
                        <div><strong>Organisme:</strong> ${data.organism}</div>
                        <div><strong>Gène:</strong> ${data.gene_name}</div>
                        <div><strong>Longueur:</strong> ${data.sequence_data.replace(/[^ATCG]/gi, '').length} bp</div>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-purple-400 mb-2">Actions</h3>
                    <div class="space-y-2">
                        <button onclick="useAsReference('${data.sequence_data.replace(/[^ATCG]/gi, '')}')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-plus mr-2"></i>Utiliser comme référence
                        </button>
                        <button onclick="compareWithNCBI('${data.sequence_data.replace(/[^ATCG]/gi, '')}')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-balance-scale mr-2"></i>Comparer avec séquence courante
                        </button>
                        <button onclick="saveToProject('${accession}', '${data.sequence_data.replace(/[^ATCG]/gi, '')}')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-save mr-2"></i>Sauvegarder dans projet
                        </button>
                        <button onclick="importNCBISequence('${data.sequence_data.replace(/[^ATCG]/gi, '')}')" class="btn-cyber w-full text-sm">
                            <i class="fas fa-download mr-2"></i>Importer Séquence
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function useAsReference(sequence) {
    document.getElementById('referenceInput').value = sequence;
    document.querySelector('.modal').remove();
    analyzeSequence();
    showNotification('Séquence NCBI définie comme référence', 'success');
}

function compareWithNCBI(sequence) {
    const currentSeq = document.getElementById('sequenceInput').value;
    if (!currentSeq) {
        showNotification('Aucune séquence courante à comparer', 'error');
        return;
    }
    
    document.getElementById('referenceInput').value = sequence;
    document.querySelector('.modal').remove();
    analyzeSequence();
    showNotification('Comparaison avec séquence NCBI lancée', 'info');
}

function saveRecentNCBISearch(query, database) {
    let recent = JSON.parse(localStorage.getItem('recentNCBISearches') || '[]');
    const search = { query, database, timestamp: Date.now() };
    
    // Éviter les doublons
    recent = recent.filter(item => item.query !== query || item.database !== database);
    recent.unshift(search);
    recent = recent.slice(0, 5); // Garder les 5 plus récents
    
    localStorage.setItem('recentNCBISearches', JSON.stringify(recent));
    loadRecentNCBISearches();
}

function loadRecentNCBISearches() {
    const recent = JSON.parse(localStorage.getItem('recentNCBISearches') || '[]');
    const container = document.getElementById('recentNCBISearches');
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="text-gray-500">Aucune recherche</div>';
        return;
    }
    
    const html = recent.map(search => `
        <div class="cursor-pointer hover:text-cyan-400 transition-colors"
             onclick="document.getElementById('ncbiSearchInput').value='${search.query}'; document.getElementById('ncbiDatabase').value='${search.database}'; searchNCBI();">
            <i class="fas fa-search mr-1"></i>${search.query} (${search.database})
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// ==========================================
// ASSISTANT IA AVANCÉ
// ==========================================

function initializeAIAssistant() {
    const aiHTML = `
        <div class="hologram p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-robot mr-2"></i>
                Assistant IA - Interprétation Scientifique
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <div class="bg-black bg-opacity-30 rounded p-4 mb-4">
                        <h4 class="font-bold text-green-400 mb-2">État de l'analyse</h4>
                        <div id="aiAnalysisStatus" class="space-y-1 text-sm">
                            <div class="flex items-center">
                                <i class="fas fa-circle text-gray-400 mr-2"></i>
                                <span>En attente d'analyse...</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="requestAIInterpretation()" id="aiInterpretButton" class="btn-cyber w-full" disabled>
                        <i class="fas fa-brain mr-2"></i>
                        Demander Interprétation IA
                    </button>
                </div>
                <div>
                    <h4 class="font-bold text-purple-400 mb-2">Interprétations IA</h4>
                    <div id="aiConclusions" class="space-y-3 max-h-80 overflow-y-auto">
                        <div class="text-gray-400 text-center py-8">
                            <i class="fas fa-brain text-4xl mb-4 opacity-50"></i>
                            <p>Aucune interprétation disponible</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insérer dans l'onglet ADN
    const dnaTab = document.getElementById('dna');
    dnaTab.appendChild(createElementFromHTML(aiHTML));
}

async function requestAIInterpretation() {
    if (!window.currentAnalysisId) {
        showNotification('Aucune analyse à interpréter', 'error');
        return;
    }
    
    const button = document.getElementById('aiInterpretButton');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>IA en cours...';
    button.disabled = false;
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INTERPRET_ANALYSIS}&analysis_id=${window.currentAnalysisId}`);
        const result = await response.json();
        
        if (result.success) {
            displayAIInterpretations(result.interpretations);
            displayFinalReport(result.final_report);
            showNotification('Interprétation IA terminée', 'success');
        } else {
            showNotification('Erreur IA: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('AI interpretation error:', error);
        showNotification('Erreur de connexion IA', 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

function displayAIInterpretations(interpretations) {
    const container = document.getElementById('aiConclusions');
    
    const html = Object.entries(interpretations).map(([type, data]) => `
        <div class="bg-gray-800 rounded p-4 border-l-4 ${getTypeColor(type)}">
            <h5 class="font-bold text-cyan-400 mb-2">
                <i class="${getTypeIcon(type)} mr-2"></i>
                ${formatInterpretationType(type)}
            </h5>
            <div class="text-sm text-gray-300 mb-3 leading-relaxed">
                ${data.interpretation.substring(0, 300)}...
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-green-400">
                    <i class="fas fa-chart-line mr-1"></i>
                    Confiance: ${Math.round(data.confidence_score * 100)}%
                </span>
                <button onclick="showFullInterpretation('${type}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" 
                        class="text-xs text-cyan-400 hover:text-cyan-300">
                    <i class="fas fa-expand mr-1"></i>Voir complet
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function getTypeColor(type) {
    const colors = {
        'mutation_impact': 'border-red-400',
        'resistance_profile': 'border-orange-400',
        'protein_function': 'border-blue-400',
        'clinical_significance': 'border-green-400'
    };
    return colors[type] || 'border-gray-400';
}

function getTypeIcon(type) {
    const icons = {
        'mutation_impact': 'fas fa-exclamation-triangle',
        'resistance_profile': 'fas fa-shield-alt',
        'protein_function': 'fas fa-cube',
        'clinical_significance': 'fas fa-user-md'
    };
    return icons[type] || 'fas fa-info-circle';
}

function formatInterpretationType(type) {
    const labels = {
        'mutation_impact': 'Impact des Mutations',
        'resistance_profile': 'Profil de Résistance',
        'protein_function': 'Fonction Protéique',
        'clinical_significance': 'Signification Clinique'
    };
    return labels[type] || type;
}

function showFullInterpretation(type, data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const parsedData = typeof data === 'string' ? JSON.parse(data.replace(/&quot;/g, '"')) : data;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="${getTypeIcon(type)} mr-2"></i>
                ${formatInterpretationType(type)} - Analyse Complète
            </h2>
            <div class="mb-4 p-4 bg-gray-800 rounded">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold text-green-400">Niveau de confiance</span>
                    <span class="text-cyan-400">${Math.round(parsedData.confidence_score * 100)}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full" 
                         style="width: ${parsedData.confidence_score * 100}%"></div>
                </div>
            </div>
            <div class="max-h-96 overflow-y-auto p-4 bg-black bg-opacity-30 rounded">
                <div class="text-gray-300 leading-relaxed whitespace-pre-wrap">${parsedData.interpretation}</div>
            </div>
            <div class="mt-4 flex justify-end space-x-4">
                <button onclick="exportInterpretation('${type}', ${JSON.stringify(parsedData).replace(/"/g, '&quot;')})" class="btn-cyber">
                    <i class="fas fa-download mr-2"></i>Exporter
                </button>
                <button onclick="shareInterpretation('${type}', ${JSON.stringify(parsedData).replace(/"/g, '&quot;')})" class="btn-cyber">
                    <i class="fas fa-share mr-2"></i>Partager
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}



// ==========================================
// ANALYSE AVANCÉE ET SAUVEGARDE
// ==========================================

async function analyzeSequence() {
    const sequence = document.getElementById('sequenceInput').value.toUpperCase().replace(/[^ATCG]/g, '');
    const reference = document.getElementById('referenceInput').value.toUpperCase().replace(/[^ATCG]/g, '');
    
    if (!sequence) {
        showNotification('Veuillez entrer une séquence ADN valide', 'error');
        return;
    }
    

    currentSequence = sequence;
    currentReference = reference || sequence;

    // Afficher progression
    showAnalysisProgress();

  
    
    // Analyses séquentielles avec progress
    await performAnalysisSteps(sequence, reference);
      // Update statistics
            updateStatistics(sequence, reference);
            
            // Analyze nucleotides
            analyzeNucleotides(sequence);
            
            // Detect mutations
            detectMutations(sequence, reference);
            
            // Update sequence viewers
            updateSequenceViewer(sequence);
            
            // Transcription and translation
            transcribeAndTranslate(sequence);
            
            // Analyze resistance
            analyzeResistanceProfile();

            // Update 3D models
            update3DModels();
                  
            
            
            // Update counters
            updateCounters();
    // Sauvegarder l'analyse
    await saveAnalysisToDatabase();
    
    // Activer le bouton IA
    document.getElementById('aiconclusion').disabled = false;
    updateAIAnalysisStatus();
    
    
}

async function analyserBackend(sequence) {

    const response = await fetch("http://localhost/s.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: sequence })
    });

    const data = await response.json();
    return data;
}

function showAnalysisProgress() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'analysisProgressModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-cogs mr-2"></i>
                Analyse en cours...
            </h2>
            <div id="analysisSteps" class="space-y-4">
                ${createProgressStep('1', 'Validation séquence', 'pending')}
                ${createProgressStep('2', 'Analyse nucléotides', 'pending')}
                ${createProgressStep('3', 'Détection mutations', 'pending')}
                ${createProgressStep('4', 'Transcription ARN', 'pending')}
                ${createProgressStep('5', 'Traduction protéine', 'pending')}
                ${createProgressStep('6', 'Analyse résistance', 'pending')}
                ${createProgressStep('7', 'Modèles 3D', 'pending')}
                
            </div>
            <div class="mt-6">
                <div class="w-full bg-gray-700 rounded-full h-3">
                    <div id="overallProgress" class="bg-gradient-to-r from-cyan-400 to-magenta-400 h-3 rounded-full transition-all duration-500" 
                         style="width: 0%"></div>
                </div>
                <p class="text-center mt-2 text-sm text-gray-400">
                    <span id="currentStep">Initialisation...</span>
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function createProgressStep(number, title, status) {
    const icons = {
        'pending': 'fas fa-circle text-gray-400',
        'running': 'fas fa-spinner fa-spin text-cyan-400',
        'completed': 'fas fa-check-circle text-green-400',
        'error': 'fas fa-times-circle text-red-400'
    };
    
    return `
        <div id="step${number}" class="flex items-center p-3 rounded ${status === 'running' ? 'bg-cyan-400 bg-opacity-20' : 'bg-gray-800'}">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                <span class="text-sm font-bold">${number}</span>
            </div>
            <div class="flex-1">
                <span class="font-semibold">${title}</span>
            </div>
            <i id="stepIcon${number}" class="${icons[status]}"></i>
        </div>
    `;
}

function updateProgressStep(stepNumber, status, title = null) {
    const step = document.getElementById(`step${stepNumber}`);
    const icon = document.getElementById(`stepIcon${stepNumber}`);
    const currentStepText = document.getElementById('currentStep');
    const overallProgress = document.getElementById('overallProgress');
    
    if (!step) return;
    
    const icons = {
        'pending': 'fas fa-circle text-gray-400',
        'running': 'fas fa-spinner fa-spin text-cyan-400',
        'completed': 'fas fa-check-circle text-green-400',
        'error': 'fas fa-times-circle text-red-400'
    };
    
    // Réinitialiser les classes
    step.className = `flex items-center p-3 rounded ${status === 'running' ? 'bg-cyan-400 bg-opacity-20' : 'bg-gray-800'}`;
    icon.className = icons[status];
    
    if (title) {
        currentStepText.textContent = title;
    }
    
    // Mettre à jour la barre de progression globale
    const progress = (stepNumber / 8) * 100;
    overallProgress.style.width = progress + '%';
}

async function performAnalysisSteps(sequence, reference) {
    const steps = [
        { fn: () => validateSequence(sequence), title: 'Validation de séquence(s)' },
        { fn: () => analyzeNucleotides(sequence), title: 'Analyse des nucléotides' },
        { fn: () => detectMutations(sequence, reference), title: 'Détection de mutation(s)' },
        { fn: () => transcribeAndTranslate(sequence), title: 'Transcription en ARN' },
        { fn: () => transcribeAndTranslate(sequence), title: 'Traduction en protéine' },
        { fn: () => analyzeResistanceProfile(), title: 'Analyse de résistance' },
        { fn: () => update3DModels(), title: 'Modélisation 3D' },
       
    ];
    
    for (let i = 0; i < steps.length; i++) {
        updateProgressStep(i + 1, 'running', steps[i].title);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulation délai
              steps[i].fn();
            updateProgressStep(i + 1, 'completed');
        } catch (error) {
            console.error(`Error in step ${i + 1}:`, error);
            updateProgressStep(i + 1, 'error');
        }
    }
    
    // Fermer le modal après 2 secondes
    setTimeout(() => {
        const modal = document.getElementById('analysisProgressModal');
        if (modal) modal.remove();
        showNotification('Analyse complète terminée!', 'success');
    }, 1000);
}

function validateSequence(sequence) {
    return new Promise((resolve, reject) => {
        if (!sequence || sequence.length < 10) {
            reject(new Error('Séquence trop courte'));
            return;
        }
        
        const validNucleotides = sequence.match(/[ATCG]/g);
        if (!validNucleotides || validNucleotides.length / sequence.length < 0.9) {
            reject(new Error('Séquence contient trop de caractères invalides'));
            return;
        }
        
        resolve();
    });
}

async function saveAnalysisToDatabase() {
    if (!currentSequence) return;
    
    const analysisData = {
        sequence_name: `Analyse_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}`,
        original_sequence: currentSequence,
        reference_sequence: currentReference,
        sequence_type: 'DNA',
        mutations: mutations,
        resistance_data: getResistanceData(),
        protein_data: getProteinData(),
        user_id: currentUser?.id || null,
        project_id: currentProject?.id || null
    };
    
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SAVE_ANALYSIS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(analysisData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.currentAnalysisId = result.analysis_id;
            addToAnalysisHistory(analysisData, result.analysis_id);
            showNotification('Analyse sauvegardée', 'success');
        }
    } catch (error) {
        console.error('Save analysis error:', error);
        showNotification('Erreur sauvegarde', 'error');
    }
}

function getResistanceData() {
    if (!resistanceChart || !resistanceChart.data) return {};
    
    const antibiotics = ['penicillin', 'tetracycline', 'chloramphenicol', 'streptomycin', 'rifampicin', 'vancomycin'];
    const resistanceData = {};
    
    resistanceChart.data.datasets[0].data.forEach((value, index) => {
        if (antibiotics[index]) {
            resistanceData[antibiotics[index]] = {
                resistance_level: value,
                mechanism: getResistanceMechanism(antibiotics[index]),
                confidence_score: 0.8
            };
        }
    });
    
    return resistanceData;
}

function getProteinData() {
    if (!currentProtein) return null;
    
    return {
        sequence: currentProtein,
        molecular_weight: document.getElementById('proteinMass')?.textContent || null,
        isoelectric_point: document.getElementById('proteinPI')?.textContent || null,
        hydrophobicity: document.getElementById('hydrophobicity')?.textContent?.replace('%', '') || null,
        secondary_alpha: document.getElementById('secondaryStructure')?.textContent?.replace('%', '') || null,
        predicted_function: 'Fonction prédite basée sur l\'analyse de séquence'
    };
}

function getResistanceMechanism(antibiotic) {
    const mechanisms = {
        'penicillin': 'β-lactamase',
        'tetracycline': 'Efflux pump',
        'chloramphenicol': 'Acetyltransferase',
        'streptomycin': 'Modification enzyme',
        'rifampicin': 'Target modification',
        'vancomycin': 'Target modification'
    };
    return mechanisms[antibiotic] || 'Unknown mechanism';
}

// ==========================================
// FONCTIONS EXISTANTES AMÉLIORÉES
// ==========================================

function updateStatistics(sequence, reference) {
    // Mise à jour statistiques existante + nouvelles métriques
    document.getElementById('seqLength').textContent = sequence.length;
    
    const gcCount = (sequence.match(/[GC]/g) || []).length;
    const gcPercentage = ((gcCount / sequence.length) * 100).toFixed(1);
    document.getElementById('gcContent').textContent = gcPercentage + '%';
    
    let mutationCount = 0;
    mutations = [];
    
    for (let i = 0; i < Math.min(sequence.length, reference.length); i++) {
        if (sequence[i] !== reference[i]) {
            mutationCount++;
            mutations.push({
                position: i,
                original: reference[i],
                mutated: sequence[i],
                type: getMutationType(reference[i], sequence[i])
            });
        }
    }
    
    document.getElementById('mutationCount').textContent = mutationCount;
    
    const similarity = reference.length > 0 ? 
        (((Math.min(sequence.length, reference.length) - mutationCount) / Math.min(sequence.length, reference.length)) * 100).toFixed(1) : 
        100;
    document.getElementById('similarity').textContent = similarity + '%';
}

   // a revoir pour encore differencier tous les types de mutations
        function getMutationType(original, mutated) {
            const transitions = ['AG', 'GA', 'CT', 'TC'];
            const transversions = ['AC', 'CA', 'AT', 'TA', 'GC', 'CG', 'GT', 'TG'];
            
            const change = original + mutated;
            if (transitions.includes(change)) return 'Transition';
            if (transversions.includes(change)) return 'Transversion';
            return 'Unknown';
        }

        function analyzeNucleotides(sequence) {
            const counts = { A: 0, T: 0, G: 0, C: 0 };
            
            for (let nucleotide of sequence) {
                if (counts.hasOwnProperty(nucleotide)) {
                    counts[nucleotide]++;
                }
            }
            
            if (nucleotideChart) {
                nucleotideChart.data.datasets[0].data = [counts.A, counts.T, counts.G, counts.C];
                nucleotideChart.update();
            }
        }

        function detectMutations(sequence, reference) {
            const alertsContainer = document.getElementById('mutationAlerts');
            if (!alertsContainer) return;
            
            alertsContainer.innerHTML = '';
            
            mutations.forEach((mutation, index) => {
                const alert = document.createElement('div');
                alert.className = 'mutation-alert p-3 rounded fade-in';
                alert.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold">${mutation.type}</span>
                        <i class="fas fa-exclamation-circle text-red-400"></i>
                    </div>
                    <div class="text-sm mt-1">
                        Position: ${mutation.position + 1} | ${mutation.original} → ${mutation.mutated}
                    </div>
                `;
                alertsContainer.appendChild(alert);
            });
        }

        function updateSequenceViewer(sequence) {
            const viewer = document.getElementById('sequenceViewer');
            if (!viewer) return;
            
            let formatted = '';
            for (let i = 0; i < sequence.length; i++) {
                const nucleotide = sequence[i];
                const isMutation = mutations.some(m => m.position === i);
                const className = `nucleotide-${nucleotide.toLowerCase()}${isMutation ? ' mutation-highlight' : ''}`;
                
                formatted += `<span class="${className}">${nucleotide}</span>`;
                
                if ((i + 1) % 10 === 0) formatted += ' ';
                if ((i + 1) % 50 === 0) formatted += '<br>';
            }
            
            viewer.innerHTML = formatted;
        }

        function transcribeAndTranslate(sequence) {
            // Transcription: ADN en ARN
            const rna = sequence.replace(/T/g, 'U');
            currentRNA = rna;
            
            // Update RNA display
            const dnaTemplate = document.getElementById('dnaTemplate');
            const rnaTranscript = document.getElementById('rnaTranscript');
            const matureRNA = document.getElementById('matureRNA');
            
            if (dnaTemplate) {
                dnaTemplate.innerHTML = formatSequence(sequence, 'dna');
            }
            if (rnaTranscript) {
                rnaTranscript.innerHTML = formatSequence(rna, 'rna');
            }
            if (matureRNA) {
                // Simulate mature RNA (remove introns, add 5' cap and 3' poly-A tail)
                const mature = 'CAP-' + rna + '-AAAAAAA';
                matureRNA.innerHTML = formatSequence(mature, 'rna');
            }
            
            // Translation: ARN en Proteine
            translateRNA(rna);
            
            // Update RNA chart
            if (rnaChart) {
                const rnaCounts = { A: 0, U: 0, G: 0, C: 0 };
                for (let nucleotide of rna) {
                    if (rnaCounts.hasOwnProperty(nucleotide)) {
                        rnaCounts[nucleotide]++;
                    }
                }
                rnaChart.data.datasets[0].data = [rnaCounts.A, rnaCounts.U, rnaCounts.G, rnaCounts.C];
                rnaChart.update();
            }
        }

        function translateRNA(rna) {
            let protein = '';
            let codons = '';
            let aminoAcidNames = '';

            console.log(' TRANSLATION DEBUG:');
            console.log('ARN input:', rna);

            // Recherche d'un codon initiateur(AUG, méthionine)
            const startIndex = rna.indexOf('AUG');
            console.log('Start index (AUG):', startIndex);

            if (startIndex === -1) {
                codons = 'Aucun codon initiateur AUG trouvé';
                console.log(' No AUG found - codons set to:', codons);
                protein = '';
                aminoAcidNames = '';
                // Update displays even when no AUG found
                const codonDisplay = document.getElementById('codonSequence');
                const proteinDisplay = document.getElementById('proteinSequence');
                const aminoDisplay = document.getElementById('aminoAcidNames');

                if (codonDisplay) {
                    codonDisplay.innerHTML = codons;
                    console.log(' Updated codonDisplay with:', codons);
                }
                if (proteinDisplay) proteinDisplay.innerHTML = formatProteinSequence(protein);
                if (aminoDisplay) aminoDisplay.innerHTML = aminoAcidNames;
                return;
            }

            console.log(' AUG found at position', startIndex);

            // Translate from start codon
            for (let i = startIndex; i < rna.length - 2; i += 3) {
                const codon = rna.substring(i, i + 3);
                console.log('🔍 Processing codon:', codon, 'at position', i);

                if (codon.length === 3) {
                    const aminoAcid = geneticCode[codon] || 'X';
                    console.log('🧬 Amino acid for', codon, ':', aminoAcid);

                    if (aminoAcid === '*') {
                        console.log(' Stop codon found, stopping translation');
                        break; // Stop la traduction, à la rencontre d'un codon stop
                    }

                    protein += aminoAcid;
                    codons += codon + ' ';
                    console.log(' Current codons string:', codons.trim());
                    console.log(' Current protein string:', protein);

                    if (aminoAcidProperties[aminoAcid]) {
                        aminoAcidNames += aminoAcidProperties[aminoAcid].name + ' ';
                    }
                }
            }

            // If no codons were found (sequence too short)
            if (!codons) {
                codons = 'Séquence ARN trop courte pour contenir des codons complets';
                console.log(' No codons found - sequence too short');
            }

            console.log(' Final codons:', codons);
            console.log(' Final protein:', protein);

            currentProtein = protein;

            // Update displays
            const codonDisplay = document.getElementById('codonSequence');
            const proteinDisplay = document.getElementById('proteinSequence');
            const aminoDisplay = document.getElementById('aminoAcidNames');

            if (codonDisplay) {
                codonDisplay.innerHTML = codons;
                console.log(' Updated codonDisplay with:', codons);
            }
            if (proteinDisplay) {
                const formattedProtein = formatProteinSequence(protein);
                proteinDisplay.innerHTML = formattedProtein;
                console.log(' Updated proteinDisplay with formatted protein');
            }
            if (aminoDisplay) {
                aminoDisplay.innerHTML = aminoAcidNames;
                console.log(' Updated aminoDisplay with:', aminoAcidNames);
            }

            // Update protein properties
            updateProteinProperties(protein);
            
            // Update amino acid chart
            updateAminoAcidChart(protein);
        }

        function formatSequence(sequence, type) {
            let formatted = '';
            for (let i = 0; i < sequence.length; i++) {
                const char = sequence[i];
                if (type === 'dna') {
                    formatted += `<span class="nucleotide-${char.toLowerCase()}">${char}</span>`;
                } else if (type === 'rna') {
                    formatted += `<span class="nucleotide-${char.toLowerCase()}">${char}</span>`;
                }
                
                if ((i + 1) % 10 === 0) formatted += ' ';
                if ((i + 1) % 50 === 0) formatted += '<br>';
            }
            return formatted;
        }

        function formatProteinSequence(protein) {
            let formatted = '';
            for (let i = 0; i < protein.length; i++) {
                const aa = protein[i];
                const props = aminoAcidProperties[aa];
                if (props) {
                    formatted += `<span class="amino-acid ${props.type}" title="${props.name}">${aa}</span>`;
                } else {
                    formatted += `<span class="amino-acid">${aa}</span>`;
                }
            }
            return formatted;
        }

         function updateProteinProperties(protein) {
            if (!protein) return;
            
            let totalMass = 0;
            let hydrophobicCount = 0;
            let chargedCount = 0;
            
            for (let aa of protein) {
                const props = aminoAcidProperties[aa];
                if (props) {
                    totalMass += props.mass;
                    if (props.type === 'hydrophobic') hydrophobicCount++;
                    if (props.type === 'charged') chargedCount++;
                }
            }
            
            const hydrophobicity = ((hydrophobicCount / protein.length) * 100).toFixed(1);
            const secondaryStructure = ((chargedCount / protein.length) * 100).toFixed(1);
            
            document.getElementById('proteinMass').textContent = totalMass.toFixed(1);
            document.getElementById('proteinPI').textContent = (7.0 + Math.random() * 6).toFixed(1);
            document.getElementById('hydrophobicity').textContent = hydrophobicity + '%';
            document.getElementById('secondaryStructure').textContent = secondaryStructure + '%';
        }

        function updateAminoAcidChart(protein) {
            if (!aminoAcidChart || !protein) return;
            
            const counts = {};
            for (let aa of protein) {
                counts[aa] = (counts[aa] || 0) + 1;
            }
            
            const labels = Object.keys(counts);
            const data = Object.values(counts);
            
            aminoAcidChart.data.labels = labels;
            aminoAcidChart.data.datasets[0].data = data;
            aminoAcidChart.update();
        }

    // Analyse de résistance par antibiotique
// Type d'organisme global (à définir via ton UI, ex: select "microorganisme" ou "humain")


function analyzeResistance() {
    const organismType = getOrganismType(); // Microbe ou Humain
    const antibiotic = document.getElementById('antibioticSelect').value;
    const resultsContainer = document.getElementById('resistanceResults');
    
    if (!antibiotic || !resultsContainer) return;
    
    resultsContainer.innerHTML = '';

    if (organismType === 'human') {
        // Pour les humains, pas de résistance
        const result = document.createElement('div');
        result.className = `antibiotic-result human`;
        result.innerHTML = `
            <div>
                <div class="font-bold">${antibiotic.charAt(0).toUpperCase() + antibiotic.slice(1)}</div>
                <div class="text-sm">Résistance non applicable</div>
            </div>
            <div class="resistance-indicator human">N/A</div>
        `;
        resultsContainer.appendChild(result);
        return;
    }

    // Pour les microbes, calcul scientifique comme avant
    const resistanceLevel = Math.min(mutations.length * 15 + Math.random() * 20, 100);
    const data = antibioticData[antibiotic];

    const result = document.createElement('div');
    result.className = `antibiotic-result ${getResistanceClass(resistanceLevel)}`;
    result.innerHTML = `
        <div>
            <div class="font-bold">${antibiotic.charAt(0).toUpperCase() + antibiotic.slice(1)}</div>
            <div class="text-sm">Cible: ${data.target}</div>
            <div class="text-sm">Mécanisme: ${data.mechanism}</div>
        </div>
        <div class="resistance-indicator ${getResistanceClass(resistanceLevel)}">
            ${resistanceLevel.toFixed(1)}%
        </div>
    `;
    resultsContainer.appendChild(result);
}

function analyzeResistanceProfile() {
    if (!resistanceChart) return;

    const organismType = getOrganismType();
    const antibiotics = ['penicillin', 'tetracycline', 'chloramphenicol', 'streptomycin', 'rifampicin', 'vancomycin'];

    if (organismType === 'human') {
        // Pour les humains, toutes les résistances = 0 ou N/A
        resistanceChart.data.datasets[0].data = antibiotics.map(() => 0);
    } else {
        // Pour les microbes, simulation scientifique
        resistanceChart.data.datasets[0].data = antibiotics.map(() => Math.min(mutations.length * 10 + Math.random() * 30, 100));
    }

    resistanceChart.update();
}


// Exemple : changer le type d'organisme via un select dans ton UI
document.getElementById('organismSelect').addEventListener('change', (e) => {
    organismType = e.target.value; // 'humain' ou 'microorganisme'
    analyzeResistanceProfile(); // mettre à jour le graphique
});



function getOrganismType() {
    const radios = document.getElementsByName('organismType');
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
    return 'microbe'; // valeur par défaut
}


// Classe CSS selon le niveau de résistance
function getResistanceClass(level) {
    if (level >= 70) return 'high-resistance';
    if (level >= 40) return 'medium-resistance';
    return 'low-resistance';
}

         function clearSequences() {
            document.getElementById('sequenceInput').value = '';
            document.getElementById('referenceInput').value = '';
            document.getElementById('sequenceViewer').innerHTML = '';
            document.getElementById('mutationAlerts').innerHTML = '';
            
            // Clear displays
            ['dnaTemplate', 'rnaTranscript', 'matureRNA', 'codonSequence', 'proteinSequence', 'aminoAcidNames'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.innerHTML = '';
            });
            
            // Reset statistics
            document.getElementById('seqLength').textContent = '0';
            document.getElementById('gcContent').textContent = '0%';
            document.getElementById('mutationCount').textContent = '0';
            document.getElementById('similarity').textContent = '0%';
            
            // Reset protein properties
            document.getElementById('proteinMass').textContent = '0';
            document.getElementById('proteinPI').textContent = '0';
            document.getElementById('hydrophobicity').textContent = '0';
            document.getElementById('secondaryStructure').textContent = '0%';
            
            // Reset charts
            if (nucleotideChart) {
                nucleotideChart.data.datasets[0].data = [0, 0, 0, 0];
                nucleotideChart.update();
            }
            if (rnaChart) {
                rnaChart.data.datasets[0].data = [0, 0, 0, 0];
                rnaChart.update();
            }
            if (aminoAcidChart) {
                aminoAcidChart.data.labels = [];
                aminoAcidChart.data.datasets[0].data = [];
                aminoAcidChart.update();
            }
            
            // Reset counters
            updateCounters(true);
        }

        function updateCounters(reset = false) {
            if (reset) {
                document.getElementById('sequencesAnalyzed').textContent = '0';
                document.getElementById('mutationsDetected').textContent = '0';
                document.getElementById('resistanceLevel').textContent = '0%';
                document.getElementById('proteinsAnalyzed').textContent = '0';
                return;
            }
            
       
          
            document.getElementById('mutationsDetected').textContent = mutations.length;
            
            const avgResistance = resistanceChart && resistanceChart.data.datasets[0].data.length > 0 ? 
                resistanceChart.data.datasets[0].data.reduce((a, b) => a + b, 0) / resistanceChart.data.datasets[0].data.length : 0;
            document.getElementById('resistanceLevel').textContent = avgResistance.toFixed(1) + '%';
            
            document.getElementById('proteinsAnalyzed').textContent = currentProtein ? currentProtein.length : 0;
        }

        // 3D controls
        function rotateDNA() {
            if (dnaModel) {
                dnaModel.rotation.x += 0.5;
                dnaModel.rotation.y += 0.5;
            }
        }

        function zoomDNA() {
            if (dnaCamera) {
                dnaCamera.position.z = dnaCamera.position.z > 5 ? 5 : 15;
            }
        }

        function rotateProtein() {
            if (proteinModel) {
                proteinModel.rotation.x += 0.5;
                proteinModel.rotation.y += 0.5;
            }
        }

        function resetProtein() {
            if (proteinModel) {
                proteinModel.rotation.set(0, 0, 0);
            }
            if (proteinCamera) {
                proteinCamera.position.set(0, 0, 10);
            }
        }

        // Data stream
        function startDataStream() {
            const dataStream = document.getElementById('dataStream');
            if (!dataStream) return;
            
            const messages = [
                'Initialisation du système...♣♣♣',
                'Chargement des bases de données...♣♣♣',
                'Analyse de séquence en cours...♣♣♣',
                'Détection de mutations...♣♣♣',
                'Transcription ADN → ARN...♣♣♣',
                'Traduction ARN → Protéine...♣♣♣',
                'Calcul des propriétés protéiques...♣♣♣',
                'Analyse de résistance...♣♣♣',
                'Génération de modèles 3D...♣♣♣',
                'Mise à jour des graphiques...♣♣♣',
                'Validation des résultats...♣♣♣',
                'Analyse terminée avec succès...♣♣♣'
            ];
            
            let messageIndex = 0;
            
            setInterval(() => {
                const timestamp = new Date().toLocaleTimeString();
                const message = messages[messageIndex % messages.length];
                
                const logEntry = document.createElement('div');
                logEntry.textContent = `[${timestamp}] ${message}`;
                logEntry.className = 'fade-in';
                
                dataStream.appendChild(logEntry);
                dataStream.scrollTop = dataStream.scrollHeight;
                
                // Limit messages
                if (dataStream.children.length > 15) {
                    dataStream.removeChild(dataStream.firstChild);
                }
                
                messageIndex++;
            }, 2000);
        }

        // Floating particles
        function createFloatingParticles() {
            const particleCount = 30;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'floating-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                document.body.appendChild(particle);
            }
        }

        // Resize handler
        window.addEventListener('resize', function() {
            const dnaContainer = document.getElementById('dnaVisualization');
            const proteinContainer = document.getElementById('proteinVisualization');
            
            if (dnaRenderer && dnaContainer) {
                dnaRenderer.setSize(dnaContainer.clientWidth, dnaContainer.clientHeight);
                dnaCamera.aspect = dnaContainer.clientWidth , dnaContainer.clientHeight;
                dnaCamera.updateProjectionMatrix();
            }
            
            if (proteinRenderer && proteinContainer) {
                proteinRenderer.setSize(proteinContainer.clientWidth, proteinContainer.clientHeight);
                proteinCamera.aspect = proteinContainer.clientWidth / proteinContainer.clientHeight;
                proteinCamera.updateProjectionMatrix();
            }
        });



function updateAIAnalysisStatus() {
    const statusContainer = document.getElementById('aiAnalysisStatus');
    const hasSequence = currentSequence.length > 0;
    const hasMutations = mutations.length > 0;
    const hasProtein = currentProtein.length > 0;
    
    const statuses = [
        { condition: hasSequence, text: 'Séquence ADN analysée', icon: 'check', color: 'green' },
        { condition: hasMutations, text: `${mutations.length} mutations détectées`, icon: hasMutations ? 'exclamation-triangle' : 'circle', color: hasMutations ? 'yellow' : 'gray' },
        { condition: hasProtein, text: 'Protéine traduite', icon: hasProtein ? 'check' : 'circle', color: hasProtein ? 'green' : 'gray' },
        { condition: window.currentAnalysisId, text: 'Analyse sauvegardée', icon: window.currentAnalysisId ? 'check' : 'circle', color: window.currentAnalysisId ? 'green' : 'gray' }
    ];
    
    const html = statuses.map(status => `
        <div class="flex items-center">
            <i class="fas fa-${status.icon} text-${status.color}-400 mr-2"></i>
            <span class="${status.condition ? 'text-white' : 'text-gray-400'}">${status.text}</span>
        </div>
    `).join('');
    
    statusContainer.innerHTML = html;
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-500 ${getNotificationClass(type)}`;
    notification.style.transform = 'translateX(100%)';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${getNotificationIcon(type)} mr-3"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-suppression
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 500);
        }
    }, 5000);
}

function getNotificationClass(type) {
    const classes = {
        'success': 'bg-green-600 border-l-4 border-green-400',
        'error': 'bg-red-600 border-l-4 border-red-400',
        'warning': 'bg-yellow-600 border-l-4 border-yellow-400',
        'info': 'bg-blue-600 border-l-4 border-blue-400'
    };
    return classes[type] || classes.info;
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

function exportInterpretation(type, data) {
    const parsedData = typeof data === 'string' ? JSON.parse(data.replace(/&quot;/g, '"')) : data;
    
    const exportData = {
        type: formatInterpretationType(type),
        interpretation: parsedData.interpretation,
        confidence_score: parsedData.confidence_score,
        generated_at: new Date().toISOString(),
        analysis_id: window.currentAnalysisId
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `interpretation_${type}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Interprétation exportée', 'success');
}

// ==========================================
// AMÉLIORATIONS 3D ET VISUALISATIONS
// ==========================================

function update3DModels() {
    return new Promise((resolve) => {
        createDNAModel();
        createProteinModel();
        updateComplexityChart();
        resolve();
    });
}

function updateComplexityChart() {
    if (!currentSequence) return;
    
    // Analyser la complexité de la séquence
    const windowSize = 50;
    const complexityData = [];
    const positions = [];
    
    for (let i = 0; i <= currentSequence.length - windowSize; i += 10) {
        const window = currentSequence.substring(i, i + windowSize);
        const complexity = calculateSequenceComplexity(window);
        complexityData.push(complexity);
        positions.push(i + windowSize / 2);
    }
    
    // Créer ou mis à jour le graphique de complexité
    if (!complexityChart) {
        const ctx = document.createElement('canvas');
        ctx.id = 'complexityChart';
        
        const container = document.createElement('div');
        container.className = 'hologram p-4 mt-6';
        container.innerHTML = `
            <h3 class="text-lg font-bold mb-3 text-cyan-400">
                <i class="fas fa-chart-line mr-2"></i>
                Complexité de la Séquence
            </h3>
            <div class="chart-container">
            </div>
        `;
        
        container.querySelector('.chart-container').appendChild(ctx);
        document.getElementById('dna').appendChild(container);
        
        complexityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: positions,
                datasets: [{
                    label: 'Complexité',
                    data: complexityData,
                    borderColor: '#00ffff',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#00ffff' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Position (bp)', color: '#00ffff' },
                        ticks: { color: '#00ffff' },
                        grid: { color: 'rgba(0, 255, 255, 0.1)' }
                    },
                    y: {
                        title: { display: true, text: 'Complexité', color: '#00ffff' },
                        ticks: { color: '#00ffff' },
                        grid: { color: 'rgba(0, 255, 255, 0.1)' },
                        min: 0,
                        max: 1
                    }
                }
            }
        });
    } else {
        complexityChart.data.labels = positions;
        complexityChart.data.datasets[0].data = complexityData;
        complexityChart.update();
    }
}

function calculateSequenceComplexity(sequence) {
    const length = sequence.length;
    if (length === 0) return 0;
    
    const counts = { A: 0, T: 0, C: 0, G: 0 };
    for (let nucleotide of sequence) {
        if (counts.hasOwnProperty(nucleotide)) {
            counts[nucleotide]++;
        }
    }
    
    let entropy = 0;
    for (let count of Object.values(counts)) {
        if (count > 0) {
            const p = count / length;
            entropy -= p * Math.log2(p);
        }
    }
    
    return entropy / 2; // Normaliser sur une échelle de 0 à 1
}

// ==========================================
// GESTIONNAIRE D'HISTORIQUE
// ==========================================

async function addToAnalysisHistory(analysisData, analysisId) {
    const historyItem = {
        id: analysisId,
        sequence_name: analysisData.sequence_name,
        sequence_length: analysisData.original_sequence.length,
        mutation_count: analysisData.mutations.length,
        timestamp: new Date().toISOString(),
        sequence_preview: analysisData.original_sequence.substring(0, 50)
    };

    // Ajouter côté frontend
    analysisHistory.unshift(historyItem);
    if (analysisHistory.length > 20) analysisHistory = analysisHistory.slice(0, 20);
    updateHistoryDisplay();

    // --- NOUVEAU : sauvegarde automatique côté backend ---
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SAVE_HISTORY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser?.id || null,
                sequence_name: analysisData.sequence_name,
                original_sequence: analysisData.original_sequence,
                mutations: analysisData.mutations,
                analysis_id: analysisId
            })
        });
        const result = await response.json();
        if (result.success) {
            console.log('Analyse sauvegardée automatiquement', result.id);
        } else {
            console.warn('Impossible de sauvegarder l’analyse automatiquement');
        }
    } catch (error) {
        console.error('Erreur sauvegarde historique:', error);
    }
}


function updateHistoryDisplay() {
    // Ajouter section historique si elle n'existe pas
    if (!document.getElementById('analysisHistory')) {
        createHistorySection();
    }
    
    const container = document.getElementById('historyList');
    
    if (analysisHistory.length === 0) {
        container.innerHTML = '<div class="text-gray-400 text-center py-4">Aucun historique</div>';
        return;
    }
    
    const html = analysisHistory.map(item => `
        <div class="p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors cursor-pointer"
             onclick="loadAnalysis('${item.id}')">
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-cyan-400">${item.sequence_name}</span>
                <span class="text-xs text-gray-400">${formatDate(item.timestamp)}</span>
            </div>
            <div class="text-sm text-gray-300 mb-1">
                Longueur: ${item.sequence_length} bp | Mutations: ${item.mutation_count}
            </div>
            <div class="text-xs font-mono text-green-400">
                ${item.sequence_preview}...
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function createHistorySection() {
    const historyHTML = `
        <div class="hologram p-6 mt-6" id="analysisHistory">
            <h3 class="text-xl font-bold mb-4 text-cyan-400">
                <i class="fas fa-history mr-2"></i>
                Historique des Analyses
            </h3>
            <div id="historyList" class="space-y-2 max-h-80 overflow-y-auto">
            </div>
            <div class="mt-4 flex justify-center">
                <button onclick="loadAnalysisHistory()" class="btn-cyber">
                    <i class="fas fa-sync mr-2"></i>
                    Actualiser l'historique
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('dna').appendChild(createElementFromHTML(historyHTML));
}

async function loadAnalysisHistory() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_HISTORY}&user_id=${currentUser?.id || null}`);
        const result = await response.json();
        
        if (result.success) {
            analysisHistory = result.data.map(item => ({
                id: item.id,
                sequence_name: item.sequence_name || 'Analyse sans nom',
                sequence_length: item.sequence_length,
                mutation_count: item.mutation_count || 0,
                timestamp: item.created_at,
                sequence_preview: item.original_sequence?.substring(0, 50) || ''
            }));
            
            updateHistoryDisplay();
            showNotification('Historique mis à jour', 'success');
        }
    } catch (error) {
        console.error('Load history error:', error);
        showNotification('Erreur chargement historique', 'error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ====================================================
// FONCTIONS EXISTANTES (maintenues pour compatibilité)
// ====================================================

// Toutes les fonctions existantes du code original sont maintenues...
// (initializeMatrixBackground, DNA/Protein visualization, charts, etc.)
 // Matrix background
        function initializeMatrixBackground() {
            const matrixBg = document.getElementById('matrixBg');
            const chars = 'ATCG0123456789';
            
            for (let i = 0; i < 100; i++) {
                const char = document.createElement('div');
                char.textContent = chars[Math.floor(Math.random() * chars.length)];
                char.style.position = 'absolute';
                char.style.left = Math.random() * 100 + '%';
                char.style.top = Math.random() * 100 + '%';
                char.style.color = '#00ffff';
                char.style.fontSize = Math.random() * 20 + 10 + 'px';
                char.style.opacity = Math.random() * 0.5;
                char.style.animation = `float ${Math.random() * 10 + 5}s ease-in-out infinite`;
                matrixBg.appendChild(char);
            }
        }

        // DNA 3D Visualization
        function initializeDNAVisualization() {
            const container = document.getElementById('dnaVisualization');
            if (!container) return;
            
            dnaScene = new THREE.Scene();
            dnaCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            dnaRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            dnaRenderer.setSize(container.clientWidth, container.clientHeight);
            dnaRenderer.setClearColor(0x000000, 0);
            container.appendChild(dnaRenderer.domElement);

            createDNAModel();
            animateDNA();
        }

        function createDNAModel() {
            // Clear existing DNA model
            if (dnaModel) {
                dnaScene.remove(dnaModel);
            }
            
            dnaModel = new THREE.Group();
            
            // Create DNA double helix
            const helixHeight = 8;
            const helixRadius = 2;
            const segments = 60;
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 6;
                const y = (i / segments) * helixHeight - helixHeight / 2;
                
                // First strand
                const sphere1 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshPhongMaterial({ color: 0x00ffff })
                );
                sphere1.position.set(
                    Math.cos(angle) * helixRadius,
                    y,
                    Math.sin(angle) * helixRadius
                );
                dnaModel.add(sphere1);
                
                // Second strand
                const sphere2 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshPhongMaterial({ color: 0xff00ff })
                );
                sphere2.position.set(
                    Math.cos(angle + Math.PI) * helixRadius,
                    y,
                    Math.sin(angle + Math.PI) * helixRadius
                );
                dnaModel.add(sphere2);
                
                // Base pairs
                if (i % 3 === 0) {
                    const bond = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.05, 0.05, helixRadius * 2, 8),
                        new THREE.MeshPhongMaterial({ color: 0xffff00 })
                    );
                    bond.position.set(0, y, 0);
                    bond.rotation.z = Math.PI / 2;
                    bond.rotation.y = angle;
                    dnaModel.add(bond);
                }
            }
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            dnaScene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            dnaScene.add(directionalLight);
            
            dnaScene.add(dnaModel);
            dnaCamera.position.set(0, 0, 10);
        }

        function animateDNA() {
            requestAnimationFrame(animateDNA);
            
            if (dnaModel) {
                dnaModel.rotation.y += 0.01;
                dnaModel.rotation.x += 0.005;
            }
            
            dnaRenderer.render(dnaScene, dnaCamera);
        }

        // Protein 3D Visualization
        function initializeProteinVisualization() {
            const container = document.getElementById('proteinVisualization');
            if (!container) return;
            
            proteinScene = new THREE.Scene();
            proteinCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            proteinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            proteinRenderer.setSize(container.clientWidth, container.clientHeight);
            proteinRenderer.setClearColor(0x000000, 0);
            container.appendChild(proteinRenderer.domElement);

            createProteinModel();
            animateProtein();
        }

        function createProteinModel() {
            if (proteinModel) {
                proteinScene.remove(proteinModel);
            }
            
            proteinModel = new THREE.Group();
            
            // Creation de de la structure proteique en fonction de la séquence proteique
            if (currentProtein) {
                const aminoAcids = currentProtein.split('');
                const radius = 3;
                
                aminoAcids.forEach((aa, index) => {
                    if (aa === '*') return; // rencontre d'un codon stop
                    
                    const props = aminoAcidProperties[aa];
                    if (!props) return;
                    
                    const angle = (index / aminoAcids.length) * Math.PI * 2;
                    const y = Math.sin(index * 0.2) * 2;
                    
                    let color;
                    switch (props.type) {
                        case 'hydrophobic': color = 0xff6b6b; break;
                        case 'hydrophilic': color = 0x4ecdc4; break;
                        case 'polar': color = 0x45b7d1; break;
                        case 'charged': color = 0xf9ca24; break;
                        default: color = 0xffffff;
                    }
                    
                    const sphere = new THREE.Mesh(
                        new THREE.SphereGeometry(0.2, 8, 8),
                        new THREE.MeshPhongMaterial({ color: color })
                    );
                    
                    sphere.position.set(
                        Math.cos(angle) * radius,
                        y,
                        Math.sin(angle) * radius
                    );
                    
                    proteinModel.add(sphere);
                    
                    // Add connections
                    if (index < aminoAcids.length - 1) {
                        const nextAngle = ((index + 1) / aminoAcids.length) * Math.PI * 2;
                        const nextY = Math.sin((index + 1) * 0.2) * 2;
                        
                        const connection = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
                            new THREE.MeshPhongMaterial({ color: 0x888888 })
                        );
                        
                        connection.position.set(
                            (Math.cos(angle) * radius + Math.cos(nextAngle) * radius) / 2,
                            (y + nextY) / 2,
                            (Math.sin(angle) * radius + Math.sin(nextAngle) * radius) / 2
                        );
                        
                        proteinModel.add(connection);
                    }
                });
            }
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            proteinScene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            proteinScene.add(directionalLight);
            
            proteinScene.add(proteinModel);
            proteinCamera.position.set(0, 0, 10);
        }

        function animateProtein() {
            requestAnimationFrame(animateProtein);
            
            if (proteinModel) {
                proteinModel.rotation.y += 0.008;
                proteinModel.rotation.x += 0.003;
            }
            
            proteinRenderer.render(proteinScene, proteinCamera);
        }

        // Charts initialization
        function initializeCharts() {
            initializeNucleotideChart();
            initializeRNAChart();
            initializeResistanceChart();
            initializeAminoAcidChart();
        }

        function initializeNucleotideChart() {
            const ctx = document.getElementById('nucleotideChart');
            if (!ctx) 
                return;
            
            nucleotideChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Adénine (A)', 'Thymine (T)', 'Guanine (G)', 'Cytosine (C)'],
                    datasets: [{
                        label: 'Fréquence',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(255, 107, 107, 0.8)',
                            'rgba(78, 205, 196, 0.8)',
                            'rgba(255, 230, 109, 0.8)',
                            'rgba(149, 225, 211, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 107, 107, 1)',
                            'rgba(78, 205, 196, 1)',
                            'rgba(255, 230, 109, 1)',
                            'rgba(149, 225, 211, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#00ffff' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#00ffff' },
                            grid: { color: 'rgba(0, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#00ffff' },
                            grid: { color: 'rgba(0, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }

        function initializeRNAChart() {
            const ctx = document.getElementById('rnaChart');
            if (!ctx) return;
            
            rnaChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Adénine (A)', 'Uracile (U)', 'Guanine (G)', 'Cytosine (C)'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(255, 107, 107, 0.8)',
                            'rgba(255, 140, 66, 0.8)',
                            'rgba(255, 230, 109, 0.8)',
                            'rgba(149, 225, 211, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 107, 107, 1)',
                            'rgba(255, 140, 66, 1)',
                            'rgba(255, 230, 109, 1)',
                            'rgba(149, 225, 211, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#00ffff' }
                        }
                    }
                }
            });
        }

        function initializeResistanceChart() {
            const ctx = document.getElementById('resistanceProfileChart');
            if (!ctx) return;
            
            resistanceChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Pénicilline', 'Tétracycline', 'Chloramphénicol', 'Streptomycine', 'Rifampicine', 'Vancomycine'],
                    datasets: [{
                        label: 'Résistance (%)',
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(255, 0, 0, 0.2)',
                        borderColor: 'rgba(255, 0, 0, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(255, 0, 0, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(255, 0, 0, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#00ffff' }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: '#00ffff' },
                            grid: { color: 'rgba(0, 255, 255, 0.1)' },
                            pointLabels: { color: '#00ffff' }
                        }
                    }
                }
            });
        }

        function initializeAminoAcidChart() {
            const ctx = document.getElementById('aminoAcidChart');
            if (!ctx) return;
            
            aminoAcidChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Fréquence',
                        data: [],
                        backgroundColor: 'rgba(0, 255, 255, 0.8)',
                        borderColor: 'rgba(0, 255, 255, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#00ffff' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#00ffff' },
                            grid: { color: 'rgba(0, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#00ffff' },
                            grid: { color: 'rgba(0, 255, 255, 0.1)' }
                        }
                    }
                }
            });
            
        }

         

// Ajout des fonctions manquantes pour la compatibilité complète
function setupAdvancedFeatures() {
    // Configuration des raccourcis clavier
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    if (window.currentAnalysisId) {
                        saveAnalysisToDatabase();
                    }
                    break;
                case 'r':
                    e.preventDefault();
                    generateRandomSequence();
                    break;
                case 'i':
                    e.preventDefault();
                    if (!document.getElementById('aiInterpretButton').disabled) {
                        requestAIInterpretation();
                    }
                    break;
            }
        }
    });
    
    // Auto-save périodique
    setInterval(() => {
        if (currentSequence && window.currentAnalysisId) {
            saveAnalysisToDatabase();
        }
    }, 300000); // Toutes les 5 minutes
}

function setupEventListeners() {
    // Listeners pour les onglets
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.onclick.toString().match(/showTab\('(.+?)'\)/)?.[1];
            if (tabName) {
                showTab(tabName);
            }
        });
    });
    
    // Listener pour la recherche en temps réel
    document.getElementById('sequenceInput')?.addEventListener('input', debounce(() => {
        if (document.getElementById('sequenceInput').value.length > 50) {
            analyzeSequence();
        }
    }, 2000));
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Export des fonctions principales pour utilisation externe
window.BiotechPlatform = {
    analyzeSequence,
    uploadFastaFile,
    searchNCBI,
    requestAIInterpretation,
    saveAnalysisToDatabase,
    loadAnalysisHistory
};

 function generateRandomSequence() {
            const nucleotides = ['A', 'T', 'C', 'G'];
            let sequence = 'ATG'; // Start with start codon
            
            for (let i = 3; i < 97; i++) {
                sequence += nucleotides[Math.floor(Math.random() * nucleotides.length)];
            }
            
            // Add stop codon
            sequence += 'TGA';
            
            document.getElementById('sequenceInput').value = sequence;
            
            // Generate reference with some mutations
            let reference = '';
            for (let i = 0; i < sequence.length; i++) {
                if (Math.random() < 0.03) { // 3% mutation rate
                    const availableNucleotides = nucleotides.filter(n => n !== sequence[i]);
                    reference += availableNucleotides[Math.floor(Math.random() * availableNucleotides.length)];
                } else {
                    reference += sequence[i];
                }
            }
            
            document.getElementById('referenceInput').value = reference;
        }

     // REMPLACER la fonction manquante par cette version complète :
function importSelectedSequences() {
    // Récupérer toutes les séquences sélectionnées
    const selectedSequences = document.querySelectorAll('.ncbi-result.selected');
    
    if (selectedSequences.length === 0) {
        showNotification('Aucune séquence sélectionnée', 'warning');
        return;
    }
    
    showNotification(`Import de ${selectedSequences.length} séquence(s) en cours...`, 'info');
    
    const importPromises = [];
    
    selectedSequences.forEach((element, index) => {
        const accession = element.dataset.accession;
        const database = element.dataset.database || 'nucleotide';
        
        if (accession) {
            importPromises.push(importSingleSequence(accession, database, index));
        }
    });
    
    Promise.all(importPromises).then(results => {
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        
        if (successful > 0) {
            // Prendre la première séquence réussie pour l'analyse
            const firstSuccess = results.find(r => r.success);
            if (firstSuccess) {
                document.getElementById('sequenceInput').value = firstSuccess.sequence;
                currentSequence = firstSuccess.sequence;
                analyzeSequence();
            }
        }
        
        let message = `Import terminé: ${successful} réussi(s)`;
        if (failed > 0) message += `, ${failed} échec(s)`;
        
        showNotification(message, successful > 0 ? 'success' : 'error');
        updateCounters();
        
    }).catch(error => {
        console.error('Import error:', error);
        showNotification('Erreur lors de l\'import des séquences', 'error');
    });
}

async function importSingleSequence(accession, database, index) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FETCH_SEQUENCE}&accession=${accession}&database=${database}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            // Parser la séquence FASTA
            const lines = result.data.sequence_data.split('\n');
            const sequence = lines.slice(1).join('').replace(/[^ATCGRYKMSWBDHVNU]/gi, '').toUpperCase();
            
            return {
                success: true,
                accession: accession,
                sequence: sequence,
                header: lines[0],
                length: sequence.length
            };
        } else {
            throw new Error(result.error || 'Erreur inconnue');
        }
    } catch (error) {
        console.error(`Import failed for ${accession}:`, error);
        return {
            success: false,
            accession: accession,
            error: error.message
        };
    }
}

// 🔹 Statistiques NCBI
function updateNCBIStatsChart() {
    const recent = JSON.parse(localStorage.getItem('recentNCBISearches') || '[]');

    // Compter les occurrences par base de données
    const dbCount = {};
    recent.forEach(item => {
        if (!dbCount[item.database]) dbCount[item.database] = 0;
        dbCount[item.database]++;
    });

    const labels = Object.keys(dbCount);
    const data = Object.values(dbCount);

    // Supprimer l'ancien chart si déjà existant
    if (window.ncbiChart) {
        window.ncbiChart.destroy();
    }

    const ctx = document.getElementById('ncbiStatsChart').getContext('2d');
    window.ncbiChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de recherches',
                data: data,
                backgroundColor: 'rgba(14, 116, 144, 0.7)',
                borderColor: 'rgba(14, 116, 144, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Statistiques des recherches NCBI récentes',
                    color: '#00FFFF',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// 🔹 Mettre à jour le chart à chaque chargement de la page et après chaque recherche
loadRecentNCBISearches();
updateNCBIStatsChart();



console.log('NEXORA VERSION 1.0!');


