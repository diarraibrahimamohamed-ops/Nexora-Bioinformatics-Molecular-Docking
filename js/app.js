/**
 * Application principale Nexora
 * Orchestration des modules et initialisation
 */

class NexoraApp {
    constructor() {
        this.modules = new Map();
        this.initialized = false;
        this.eventListeners = new Map();
    }

    /**
     * Initialise l'application
     */
    async init() {
        try {
            console.log(' Initialisation de Nexora...');

            // Initialiser les modules dans l'ordre
            await this.initConfig();
            await this.initState();
            await this.initApi();
            await this.initUI();
            await this.initBioinformatics();
            await this.initVisualization();

            // Initialiser l'optimiseur async
            if (typeof initializeAsyncOptimizer === 'function') {
                initializeAsyncOptimizer();
            }

            this.initialized = true;
            console.log(' Nexora initialisé avec succès');

            // Émettre l'événement d'initialisation
            this.emit('app:ready', { version: '2.0.0' });

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.emit('app:error', { error: error.message });
        }
    }

    /**
     * Initialise la configuration
     */
    async initConfig() {
        // La configuration est déjà chargée dans config.js
        this.modules.set('config', CONFIG);
        console.log(' Configuration chargée');
    }

    /**
     * Initialise la gestion d'état
     */
    async initState() {
        // Restaurer l'état depuis localStorage
        state.restore('currentUser');
        state.restore('analysisHistory');

        // Souscrire aux changements importants
        subscribeState('currentUser', (user) => {
            this.emit('auth:userChanged', user);
        });

        subscribeState('currentSequence', (sequence) => {
            this.emit('sequence:loaded', sequence);
        });

        this.modules.set('state', state);
        console.log(' Gestion d\'état initialisée');
    }

    /**
     * Initialise l'API client
     */
    async initApi() {
        // Tester la connectivité API
        try {
            const testResponse = await api.request('?action=test', { timeout: 5000 });
            console.log(' API connectée');
        } catch (error) {
            console.warn(' API non disponible:', error.message);
        }

        this.modules.set('api', api);
    }

    /**
     * Initialise l'interface utilisateur
     */
    async initUI() {
        this.initEventListeners();
        this.initProgressTracking();
        this.initNotifications();
        console.log(' Interface utilisateur initialisée');
    }

    /**
     * Initialise les fonctionnalités bioinformatiques
     */
    async initBioinformatics() {
        this.initSequenceValidation();
        this.initMutationDetection();
        this.initAntibioticResistance();
        console.log(' Moteurs bioinformatiques initialisés');
    }

    /**
     * Initialise la visualisation 3D
     */
    async initVisualization() {
        // Initialiser les scènes Three.js si disponibles
        if (typeof THREE !== 'undefined') {
            this.init3DScenes();
        }

        // Initialiser Chart.js si disponible
        if (typeof Chart !== 'undefined') {
            this.initCharts();
        }

        console.log(' Visualisations initialisées');
    }

    /**
     * Gestionnaire d'événements unifié
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Erreur dans le callback pour', event, error);
                }
            });
        }
    }

    /**
     * Accès aux modules
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Test de santé de l'application
     */
    healthCheck() {
        return {
            initialized: this.initialized,
            modules: Array.from(this.modules.keys()),
            state: state.getStats(),
            api: api.getCacheStats()
        };
    }
}

// Fonctions de compatibilité avec l'ancien code
function updateProgressStep(step, status, message = '') {
    state.set(`progressSteps.${step}`, { status, message, timestamp: Date.now() });

    // Émettre l'événement pour les autres modules
    nexoraApp.emit('progress:update', { step, status, message });
}

function showNotification(message, type = 'info', duration = 5000) {
    const notification = {
        id: Date.now(),
        message,
        type,
        duration,
        timestamp: Date.now()
    };

    state.set('notifications', [...state.get('notifications', []), notification]);

    // Auto-suppression
    if (duration > 0) {
        setTimeout(() => {
            const notifications = state.get('notifications', []);
            const filtered = notifications.filter(n => n.id !== notification.id);
            state.set('notifications', filtered);
        }, duration);
    }
}

// Instance globale de l'application
const nexoraApp = new NexoraApp();

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    nexoraApp.init();
});

// Export pour debug
window.nexoraApp = nexoraApp;
window.getState = getState;
window.setState = setState;
window.api = api;
