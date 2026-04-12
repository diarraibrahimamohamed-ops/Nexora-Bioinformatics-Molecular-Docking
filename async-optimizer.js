// =========================================================================
// async-optimizer.js - Version améliorée
// Gère découpage, analyse, transcription & traduction sans perte de données
// =========================================================================

(function() {
    'use strict';

    const CHUNK_SIZE = 20000;    // Taille de chaque bloc
    const PAUSE_MS = 3000;         // Petite pause entre les blocs
    const LONG_PAUSE_MS = 5000;    // Pause plus longue toutes les 5 itérations
    const THRESHOLD = 100000;    // Taille à partir de laquelle le mode async s’active

    const originalFunctions = {};

    // ===============================
    // Gestion de traitement par chunk
    // ===============================
    async function processInChunks(sequence, processor) {
        let processedChunks = 0;

        for (let i = 0; i < sequence.length; i += CHUNK_SIZE) {
            const chunk = sequence.slice(i, i + CHUNK_SIZE);
            await processor(chunk, i);
            processedChunks++;

            // Libération de mémoire périodique
            if (processedChunks % 5 === 0 && window.gc) {
                window.gc();
                await new Promise(r => setTimeout(r, LONG_PAUSE_MS));
            } else {
                await new Promise(r => setTimeout(r, PAUSE_MS));
            }
        }
    }

    // ========================================
    // Fonctions asynchrones avec accumulateurs
    // ========================================

    async function validateSequenceAsync(sequence) {
        try {
            await originalFunctions.validateSequence(sequence);
            updateProgressStep(1, 'completed');
        } catch (e) {
            updateProgressStep(1, 'error', e.message);
            throw e;
        }
    }

    async function analyzeNucleotidesAsync(sequence) {
        let totalCounts = { A: 0, T: 0, C: 0, G: 0 };

        await processInChunks(sequence, async (chunk, offset) => {
            const chunkCounts = originalFunctions.analyzeNucleotides(chunk);
            if (chunkCounts) {
                for (const base in chunkCounts) {
                    totalCounts[base] += chunkCounts[base] || 0;
                }
            }

            updateProgressStep(
                2,
                'running',
                `Analyse nucléotidique (${Math.min(offset + chunk.length, sequence.length)}/${sequence.length})`
            );
        });

        const total = Object.values(totalCounts).reduce((a, b) => a + b, 0);
        const percentages = {};
        for (const base in totalCounts) {
            percentages[base] = ((totalCounts[base] / total) * 100).toFixed(2);
        }

        updateProgressStep(2, 'completed', 'Analyse nucléotidique terminée');
        return { counts: totalCounts, percentages };
    }

    async function detectMutationsAsync(sequence, reference) {
        const minLength = Math.min(sequence.length, reference.length);
        await processInChunks(sequence.substring(0, minLength), async (chunk, offset) => {
            const refChunk = reference.substring(offset, offset + chunk.length);
            originalFunctions.detectMutations(chunk, refChunk);

            updateProgressStep(
                3,
                'running',
                `Détection mutations (${Math.min(offset + chunk.length, minLength)}/${minLength})`
            );
        });
        updateProgressStep(3, 'completed');
    }

    async function transcribeAndTranslateAsync(sequence) {
        let remainder = '';
        let fullRna = '';

        await processInChunks(sequence, async (chunk, offset) => {
            const fullChunk = remainder + chunk;
            const rna = fullChunk.replace(/T/g, 'U');
            remainder = rna.slice(-(rna.length % 3));
            const translatable = rna.slice(0, rna.length - remainder.length);
            fullRna += translatable;

            updateProgressStep(
                4,
                'running',
                `Transcription/Traduction (${Math.min(offset + chunk.length, sequence.length)}/${sequence.length})`
            );
        });

        // Traduire le reste final
        if (remainder.length >= 3) {
            fullRna += remainder.slice(0, remainder.length - (remainder.length % 3));
        }

        // Une fois tout réuni, on effectue la traduction complète
        const protein = originalFunctions.transcribeAndTranslate(fullRna);
        updateProgressStep(4, 'completed', 'Traduction terminée');
        return protein;
    }

    async function analyzeResistanceProfileAsync() {
        updateProgressStep(5, 'running', 'Analyse de résistance...');
        await new Promise(r => setTimeout(r, 500));
        originalFunctions.analyzeResistanceProfile();
        updateProgressStep(5, 'completed');
    }

    async function update3DModelsAsync() {
        updateProgressStep(6, 'running', 'Mise à jour modèles 3D...');
        await new Promise(r => setTimeout(r, 500));
        originalFunctions.update3DModels();
        updateProgressStep(6, 'completed');
    }

    async function updateCountersAsync() {
        updateProgressStep(7, 'running', 'Mise à jour compteurs...');
        await new Promise(r => setTimeout(r, 200));
        originalFunctions.updateCounters();
        updateProgressStep(7, 'completed');
    }

    

    // ================================
    // Système d'override intelligent
    // ================================
    function overrideFunction(name, asyncVersion) {
        if (typeof window[name] === 'function') {
            originalFunctions[name] = window[name];
            window[name] = function(...args) {
                const largeInput = args.find(a => typeof a === 'string' && a.length > THRESHOLD);
                if (largeInput) {
                    console.log(`Mode async activé pour ${name} (${largeInput.length.toLocaleString()} caractères)`);
                    return asyncVersion.apply(this, args);
                } else {
                    return originalFunctions[name].apply(this, args);
                }
            };
        }
    }

    // ========================
    // Initialisation globale
    // ========================
    function initializeAsyncOptimizer() {
        console.log(' Initialisation Async Optimizer amélioré...');

        overrideFunction('validateSequence', validateSequenceAsync);
        overrideFunction('detectMutations', detectMutationsAsync);
        overrideFunction('transcribeAndTranslate', transcribeAndTranslateAsync);
        overrideFunction('analyzeResistanceProfile', analyzeResistanceProfileAsync);
        overrideFunction('update3DModels', update3DModelsAsync);
        overrideFunction('updateCounters', updateCountersAsync);
        

        console.log(`Async Optimizer prêt (seuil: ${THRESHOLD.toLocaleString()} bp)`);
    }

    // Auto-init une fois le DOM chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initializeAsyncOptimizer, 100));
    } else {
        setTimeout(initializeAsyncOptimizer, 100);
    }

})();
