class ApiService {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        // Auto-add token to requests
        this.interceptRequests();
    }

    interceptRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            if (url.startsWith('/api') && this.token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': this.token,
                    'Content-Type': 'application/json'
                };
            }
            return originalFetch(url, options);
        };
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (response.status === 401) {
                this.removeToken();
                window.dispatchEvent(new CustomEvent('authRequired'));
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const result = await this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (result.success) {
            this.setToken(result.token);
        }
        
        return result;
    }

    // AOG Records
    async getAOGRecords() {
        return this.request('/api/aog-records');
    }

    async addAOGRecord(record) {
        return this.request('/api/aog-records', {
            method: 'POST',
            body: JSON.stringify(record)
        });
    }

    async deleteAOGRecord(id) {
        return this.request(`/api/aog-records/${id}`, {
            method: 'DELETE'
        });
    }

    // Limitation Records
    async getLimitationRecords() {
        return this.request('/api/limitation-records');
    }

    async addLimitationRecord(record) {
        return this.request('/api/limitation-records', {
            method: 'POST',
            body: JSON.stringify(record)
        });
    }

    async deleteLimitationRecord(id) {
        return this.request(`/api/limitation-records/${id}`, {
            method: 'DELETE'
        });
    }

    // Maintenance Records
    async getMaintenanceRecords() {
        return this.request('/api/maintenance-records');
    }

    async addMaintenanceRecord(record) {
        return this.request('/api/maintenance-records', {
            method: 'POST',
            body: JSON.stringify(record)
        });
    }

    async deleteMaintenanceRecord(id) {
        return this.request(`/api/maintenance-records/${id}`, {
            method: 'DELETE'
        });
    }

    // Archive
    async getArchiveRecords(type = null) {
        const endpoint = type ? `/api/archive?type=${type}` : '/api/archive';
        return this.request(endpoint);
    }

    // Statistics
    async getStats() {
        return this.request('/api/stats');
    }

    // Aircraft
    async getAircraft() {
        return this.request('/api/aircraft');
    }
}

const apiService = new ApiService();