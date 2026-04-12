/**
 * Pont de compatibilité entre anciens et nouveaux modules
 * Rend les fonctions nécessaires disponibles globalement
 */

(function() {
    'use strict';

    console.log('🔗 Initialisation du pont de compatibilité...');

    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Délai pour laisser les modules s'initialiser
        setTimeout(function() {
            setupGlobalFunctions();
            console.log(' Pont de compatibilité établi');
        }, 200);
    });

    function setupGlobalFunctions() {
        // Variables globales nécessaires pour g.js
        if (typeof CONFIG !== 'undefined') {
            window.API_CONFIG = CONFIG.API;
            window.geneticCode = GENETIC_CODE;
            window.aminoAcidProperties = AMINO_ACID_PROPERTIES;
        }

        // Fonctions de gestion d'état
        if (typeof state !== 'undefined') {
            // Variables globales que g.js utilise
            window.currentSequence = '';
            window.currentReference = '';
            window.currentRNA = '';
            window.currentProtein = '';
            window.mutations = [];
            window.analysisHistory = [];
            window.currentUser = null;
            window.currentFastaFile = null;
            window.currentFastaSequences = [];
            window.ncbiSearchHistory = [];

            // Synchronisation avec le state manager
            setState('currentSequence', '');
            setState('currentReference', '');
            setState('mutations', []);
            setState('analysisHistory', []);

            // Fonctions de compatibilité
            window.updateProgressStep = function(step, status, message = '') {
                if (nexoraApp) {
                    nexoraApp.emit('progress:update', { step, status, message });
                }
            };

            window.showNotification = function(message, type = 'info', duration = 5000) {
                if (nexoraApp) {
                    nexoraApp.emit('notification:show', { message, type, duration });
                }
                // Affichage basique en attendant
                console.log(`[${type.toUpperCase()}] ${message}`);
            };
        }

        // Fonctions API
        if (typeof api !== 'undefined') {
            window.api = api;
        }

        // Variables 3D
        window.dnaScene = null;
        window.dnaCamera = null;
        window.dnaRenderer = null;
        window.proteinScene = null;
        window.proteinCamera = null;
        window.proteinRenderer = null;

        // Charts
        window.nucleotideChart = null;
        window.rnaChart = null;
        window.resistanceChart = null;
        window.aminoAcidChart = null;
        window.complexityChart = null;
        window.ncbiStatsChart = null;

        // Cache
        window.ncbiCache = new Map();
        window.aiInterpretations = {};

        console.log(' Toutes les fonctions globales sont disponibles');
    }

    // Exposer globalement pour debug
    window.bridgeDebug = function() {
        return {
            CONFIG: typeof CONFIG !== 'undefined',
            state: typeof state !== 'undefined',
            api: typeof api !== 'undefined',
            nexoraApp: typeof nexoraApp !== 'undefined',
            globals: {
                API_CONFIG: typeof window.API_CONFIG !== 'undefined',
                currentSequence: typeof window.currentSequence !== 'undefined',
                updateProgressStep: typeof window.updateProgressStep === 'function'
            }
        };
    };

})();
