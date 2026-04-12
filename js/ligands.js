/**
 * Module de gestion des ligands validés - Nexora
 * Interface pour la sélection scientifique de ligands
 * Conforme aux standards internationaux de la recherche pharmaceutique
 */

// Variables globales pour les ligands
let validatedLigands = [];
let selectedLigand = null;

// Initialisation du module de ligands
function initLigandsModule() {
    console.log('Initialisation du module ligands validés...');
    loadValidatedLigands();
    setupLigandEventListeners();
}

// Charger les ligands validés depuis l'API
async function loadValidatedLigands() {
    try {
        console.log('Chargement des ligands validés...');
        const response = await fetch('ligands_api.php?action=get_validated_ligands&limit=100');
        const data = await response.json();
        
        console.log('Réponse ligands API:', data);
        
        const select = document.getElementById('validatedLigandSelect');
        if (!select) {
            console.error('Element validatedLigandSelect non trouvé');
            return;
        }
        
        if (data.success && data.ligands) {
            validatedLigands = data.ligands;
            populateLigandSelect(data.ligands);
            console.log(`${data.ligands.length} ligands chargés avec succès`);
        } else {
            console.error('Erreur chargement ligands:', data);
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    } catch (error) {
        console.error('Erreur chargement ligands:', error);
        const select = document.getElementById('validatedLigandSelect');
        if (select) {
            select.innerHTML = '<option value="">Erreur de connexion</option>';
        }
    }
}

// Peupler la liste déroulante des ligands
function populateLigandSelect(ligands) {
    const select = document.getElementById('validatedLigandSelect');
    
    // Grouper par catégorie
    const categories = {};
    ligands.forEach(ligand => {
        if (!categories[ligand.category]) {
            categories[ligand.category] = [];
        }
        categories[ligand.category].push(ligand);
    });
    
    // Vider et reconstruire le select
    select.innerHTML = '<option value="">Sélectionnez un ligand validé...</option>';
    
    // Ajouter les options groupées par catégorie
    Object.keys(categories).sort().forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = getCategoryDisplayName(category);
        
        categories[category].forEach(ligand => {
            const option = document.createElement('option');
            option.value = ligand.id;
            
            // Afficher le nom avec des informations clés
            let displayName = ligand.name;
            if (ligand.status === 'approved') {
                displayName += ' ✓';
            } else if (ligand.status === 'clinical_trial') {
                displayName += ' ⚗️';
            }
            
            if (ligand.drug_likeness_score >= 0.8) {
                displayName += ' ★';
            }
            
            option.textContent = displayName;
            option.dataset.ligandData = JSON.stringify(ligand);
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    });
}

// Obtenir le nom d'affichage d'une catégorie
function getCategoryDisplayName(category) {
    const names = {
        'analgesic': '🔬 Analgésiques',
        'anti-inflammatory': '💊 Anti-inflammatoires',
        'antibiotic': '🦠 Antibiotiques',
        'antiviral': '🦠 Antiviraux',
        'antineoplastic': '🎯 Antinéoplasiques',
        'kinase_inhibitor': '🧬 Inhibiteurs de Kinases',
        'protease_inhibitor': '⚡ Inhibiteurs de Protéases',
        'stimulant': '⚡ Stimulants',
        'opioid': '🔷 Opioides',
        'benzodiazepine': '💊 Benzodiazépines',
        'flavonoid': '🌿 Flavonoïdes',
        'polyphenol': '🌿 Polyphénols',
        'neurotransmitter': '🧠 Neurotransmetteurs',
        'vitamin': '💉 Vitamines',
        'steroid': '💊 Stéroïdes',
        'nucleotide': '🧬 Nucléotides',
        'cofactor': '⚗️ Cofacteurs'
    };
    
    return names[category] || `🔬 ${category}`;
}

// Configurer les écouteurs d'événements pour les ligands
function setupLigandEventListeners() {
    const ligandSelect = document.getElementById('validatedLigandSelect');
    if (ligandSelect) {
        ligandSelect.addEventListener('change', function() {
            const ligandId = this.value;
            if (ligandId) {
                selectLigand(ligandId);
            } else {
                clearLigandSelection();
            }
        });
    }
}

// Sélectionner un ligand et afficher ses informations
function selectLigand(ligandId) {
    const ligand = validatedLigands.find(l => l.id == ligandId);
    if (!ligand) {
        console.error('Ligand non trouvé:', ligandId);
        return;
    }
    
    selectedLigand = ligand;
    console.log('Ligand sélectionné:', ligand);
    
    // Mettre à jour le champ SMILES
    const smilesInput = document.getElementById('ligandSmiles');
    if (smilesInput) {
        smilesInput.value = ligand.smiles;
    }
    
    // Afficher les informations du ligand
    displayLigandInfo(ligand);
    
    // Valider la sélection si une analyse est choisie
    validateLigandSelection();
}

// Afficher les informations détaillées du ligand
function displayLigandInfo(ligand) {
    const infoDiv = document.getElementById('ligandInfo');
    if (!infoDiv) return;
    
    // Mettre à jour les informations de base
    document.getElementById('ligandCategory').textContent = getCategoryDisplayName(ligand.category);
    document.getElementById('ligandWeight').textContent = `${ligand.molecular_weight} Da`;
    document.getElementById('ligandLogP').textContent = ligand.logp;
    document.getElementById('ligandScore').textContent = `${(ligand.drug_likeness_score * 100).toFixed(1)}%`;
    document.getElementById('ligandDescription').textContent = ligand.description || 'Aucune description disponible';
    
    // Afficher les avertissements
    const warningsDiv = document.getElementById('ligandWarnings');
    const warnings = [];
    
    if (ligand.lipinski_violations && ligand.lipinski_violations.length > 0) {
        warnings.push(`Violations Lipinski: ${ligand.lipinski_violations.join(', ')}`);
    }
    
    if (ligand.status === 'research') {
        warnings.push('⚠️ Ligand expérimental - validation requise');
    }
    
    if (ligand.drug_likeness_score < 0.4) {
        warnings.push('⚠️ Faible drug-likeness');
    }
    
    warningsDiv.innerHTML = warnings.length > 0 ? warnings.join('<br>') : '✅ Aucun avertissement';
    
    // Afficher la section d'informations
    infoDiv.classList.remove('hidden');
    
    // Colorer selon le statut
    if (ligand.status === 'approved') {
        infoDiv.classList.add('border-green-400');
        infoDiv.classList.remove('border-yellow-400', 'border-red-400');
    } else if (ligand.status === 'clinical_trial') {
        infoDiv.classList.add('border-yellow-400');
        infoDiv.classList.remove('border-green-400', 'border-red-400');
    } else {
        infoDiv.classList.add('border-red-400');
        infoDiv.classList.remove('border-green-400', 'border-yellow-400');
    }
}

// Effacer la sélection de ligand
function clearLigandSelection() {
    selectedLigand = null;
    
    const smilesInput = document.getElementById('ligandSmiles');
    if (smilesInput) {
        smilesInput.value = '';
    }
    
    const infoDiv = document.getElementById('ligandInfo');
    if (infoDiv) {
        infoDiv.classList.add('hidden');
    }
}

// Valider la sélection du ligand avec l'analyse
async function validateLigandSelection() {
    if (!selectedLigand || !currentAnalysisId) {
        return;
    }
    
    try {
        console.log('Validation de la sélection ligand-analyse...');
        
        const response = await fetch('ligands_api.php?action=validate_ligand_selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ligand_id: selectedLigand.id,
                analysis_id: currentAnalysisId
            })
        });
        
        const result = await response.json();
        console.log('Résultat validation:', result);
        
        if (result.success && result.validation) {
            displayValidationResult(result.validation);
        }
    } catch (error) {
        console.error('Erreur validation sélection:', error);
    }
}

// Afficher les résultats de validation
function displayValidationResult(validation) {
    // Créer ou mettre à jour la section de validation
    let validationDiv = document.getElementById('ligandValidation');
    if (!validationDiv) {
        validationDiv = document.createElement('div');
        validationDiv.id = 'ligandValidation';
        validationDiv.className = 'bg-gray-800 bg-opacity-50 p-4 rounded mt-4';
        
        const ligandInfo = document.getElementById('ligandInfo');
        if (ligandInfo) {
            ligandInfo.parentNode.insertBefore(validationDiv, ligandInfo.nextSibling);
        }
    }
    
    const score = validation.compatibility_score;
    const scoreClass = score >= 80 ? 'text-green-400' : (score >= 60 ? 'text-yellow-400' : 'text-red-400');
    const scoreText = score >= 80 ? 'Excellent' : (score >= 60 ? 'Bon' : 'Modéré');
    
    validationDiv.innerHTML = `
        <h5 class="font-bold text-cyan-400 mb-2">
            <i class="fas fa-check-circle mr-2"></i>Validation Scientifique
        </h5>
        <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
                <span class="text-sm text-gray-400">Score de compatibilité:</span>
                <div class="text-lg font-semibold ${scoreClass}">${score}/100 - ${scoreText}</div>
            </div>
            <div>
                <span class="text-sm text-gray-400">Statut ligand:</span>
                <div class="text-lg font-semibold text-cyan-400">${getLigandStatusText(validation.ligand_info.status)}</div>
            </div>
        </div>
        
        ${validation.compatibility_notes && validation.compatibility_notes.length > 0 ? `
        <div class="mb-3">
            <h6 class="text-sm font-semibold text-blue-400 mb-1">Notes de compatibilité:</h6>
            <ul class="text-xs text-gray-300 list-disc list-inside">
                ${validation.compatibility_notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${validation.warnings && validation.warnings.length > 0 ? `
        <div class="mb-3">
            <h6 class="text-sm font-semibold text-yellow-400 mb-1">⚠️ Avertissements:</h6>
            <ul class="text-xs text-yellow-300 list-disc list-inside">
                ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${validation.recommended_parameters ? `
        <div class="mt-3">
            <h6 class="text-sm font-semibold text-purple-400 mb-1">Paramètres recommandés:</h6>
            <div class="text-xs text-gray-300">
                <span class="mr-3">Exhaustiveness: ${validation.recommended_parameters.exhaustiveness}</span>
                <span class="mr-3">Modes: ${validation.recommended_parameters.num_modes}</span>
                <span>Range: ${validation.recommended_parameters.energy_range} kcal/mol</span>
            </div>
        </div>
        ` : ''}
    `;
}

// Obtenir le texte du statut du ligand
function getLigandStatusText(status) {
    const statusTexts = {
        'approved': '✅ Approuvé',
        'clinical_trial': '⚗️ Essai clinique',
        'experimental': '🔬 Expérimental',
        'research': '📚 Recherche'
    };
    
    return statusTexts[status] || status;
}

// Fonction de recherche de ligands
async function searchLigands(query) {
    if (query.length < 2) return [];
    
    try {
        const response = await fetch(`ligands_api.php?action=search_ligands&q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        
        if (data.success && data.results) {
            return data.results;
        }
    } catch (error) {
        console.error('Erreur recherche ligands:', error);
    }
    
    return [];
}

// Exporter les fonctions pour l'utilisation globale
window.initLigandsModule = initLigandsModule;
window.loadValidatedLigands = loadValidatedLigands;
window.selectLigand = selectLigand;
window.clearLigandSelection = clearLigandSelection;
window.validateLigandSelection = validateLigandSelection;
window.searchLigands = searchLigands;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur une page avec docking
    if (document.getElementById('validatedLigandSelect')) {
        initLigandsModule();
    }
});
