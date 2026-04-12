/**
 * Module API unifié pour Nexora
 * Gestion centralisée des appels API avec cache et gestion d'erreurs
 */

class ApiClient {
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || 'api.php',
            timeout: config.timeout || 600000, // 10 minutes timeout for docking
            retries: config.retries || 3,
            ...config
        };

        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Effectue une requête HTTP avec gestion d'erreurs et cache
     */
    async request(endpoint, options = {}) {
        const url = this.config.baseUrl + endpoint;
        const cacheKey = this.getCacheKey(url, options);

        // Vérifier le cache
        if (options.method === 'GET' && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() < cached.expires) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        // Éviter les requêtes dupliquées
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const requestPromise = this.performRequest(url, options, cacheKey);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;

            // Mettre en cache les succès GET
            if (options.method === 'GET' && result.success && options.cache !== false) {
                const ttl = options.cacheTtl || 300000; // 5 minutes par défaut
                this.cache.set(cacheKey, {
                    data: result,
                    expires: Date.now() + ttl
                });
            }

            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Effectue la requête HTTP avec retry
     */
    async performRequest(url, options, cacheKey, attempt = 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader(),
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (attempt < this.config.retries && this.shouldRetry(error)) {
                await this.delay(Math.pow(2, attempt) * 1000); // Backoff exponentiel
                return this.performRequest(url, options, cacheKey, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Méthodes spécifiques aux endpoints
     */
    async searchNcbi(query, options = {}) {
        return this.request(CONFIG.API.ENDPOINTS.SEARCH_NCBI, {
            method: 'GET',
            body: { query, ...options }
        });
    }

    async fetchSequence(accession, database = 'nucleotide') {
        const cacheKey = `sequence_${accession}_${database}`;
        return this.request(CONFIG.API.ENDPOINTS.FETCH_SEQUENCE, {
            method: 'GET',
            body: { accession, database },
            cacheTtl: CONFIG.CACHE.SEQUENCE_TTL * 1000
        });
    }

    async saveAnalysis(data) {
        return this.request(CONFIG.API.ENDPOINTS.SAVE_ANALYSIS, {
            method: 'POST',
            body: data,
            cache: false
        });
    }

    async getAnalysisHistory() {
        return this.request(CONFIG.API.ENDPOINTS.GET_HISTORY, {
            method: 'GET',
            cacheTtl: CONFIG.CACHE.ANALYSIS_TTL * 1000
        });
    }

    /**
     * Utilitaires
     */
    getCacheKey(url, options) {
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${url}_${body}`;
    }

    getAuthHeader() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return token ? `Bearer ${token}` : '';
    }

    shouldRetry(error) {
        // Ne pas retry sur les erreurs 4xx (sauf 408, 429)
        if (error.message.includes('HTTP 4')) {
            return error.message.includes('408') || error.message.includes('429');
        }
        return true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            pendingRequests: this.pendingRequests.size
        };
    }
}

// Instance globale
const api = new ApiClient(CONFIG.API);

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api };
}