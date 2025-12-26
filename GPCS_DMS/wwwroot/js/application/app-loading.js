/**
 * Loading System - 和風デザイン (Japanese Design)
 * Simple, Elegant, Non-intrusive
 */
class AppLoading {
    constructor() {
        if (AppLoading.instance) {
            return AppLoading.instance;
        }
        
        AppLoading.instance = this;
        this.activeLoadings = new Map();
        this.globalLoading = null;
        this._init();
    }

    _init() {
        // Create global loading overlay (hidden by default)
        this.globalOverlay = document.createElement('div');
        this.globalOverlay.className = 'loading-overlay';
        this.globalOverlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading...</div>
            </div>
        `;
        document.body.appendChild(this.globalOverlay);
    }

    /**
     * Show global loading (fullscreen)
     * @param {string} text - Loading text
     * @returns {string} loadingId
     */
    show(text = 'Loading...') {
        const loadingId = this._generateId();
        
        // Update text
        const textEl = this.globalOverlay.querySelector('.loading-text');
        if (textEl) {
            textEl.textContent = text;
        }

        // Show overlay
        this.globalOverlay.classList.add('show');
        
        // Store reference
        this.globalLoading = {
            id: loadingId,
            text,
            startTime: Date.now()
        };

        return loadingId;
    }

    /**
     * Hide global loading
     */
    hide() {
        this.globalOverlay.classList.remove('show');
        this.globalLoading = null;
    }

    /**
     * Show loading on specific element
     * @param {string|HTMLElement} target - CSS selector or element
     * @param {object} options - Loading options
     * @returns {string} loadingId
     */
    showOn(target, options = {}) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;

        if (!element) {
            console.warn('Loading target not found:', target);
            return null;
        }

        const loadingId = this._generateId();
        const config = {
            text: 'Loading...',
            spinner: true,
            overlay: true,
            size: 'medium', // small, medium, large
            ...options
        };

        // Create loading element
        const loadingEl = document.createElement('div');
        loadingEl.className = `loading-local ${config.overlay ? 'with-overlay' : ''}`;
        loadingEl.dataset.loadingId = loadingId;
        
        loadingEl.innerHTML = `
            <div class="loading-content loading-${config.size}">
                ${config.spinner ? '<div class="loading-spinner"></div>' : ''}
                ${config.text ? `<div class="loading-text">${config.text}</div>` : ''}
            </div>
        `;

        // Make element relative if not already positioned
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(loadingEl);

        // Store reference
        this.activeLoadings.set(loadingId, {
            element: loadingEl,
            target: element,
            config,
            startTime: Date.now()
        });

        // Trigger animation
        requestAnimationFrame(() => {
            loadingEl.classList.add('show');
        });

        return loadingId;
    }

    /**
     * Hide specific loading
     * @param {string} loadingId
     */
    hideOn(loadingId) {
        const loading = this.activeLoadings.get(loadingId);
        if (!loading) return;

        const { element } = loading;
        
        element.classList.remove('show');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.activeLoadings.delete(loadingId);
        }, 200);
    }

    /**
     * Show inline loading (for buttons, etc.)
     * @param {string|HTMLElement} target
     * @returns {string} loadingId
     */
    showInline(target) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;

        if (!element) return null;

        const loadingId = this._generateId();
        
        // Store original content
        const originalContent = element.innerHTML;
        const originalDisabled = element.disabled;

        // Add loading state
        element.disabled = true;
        element.classList.add('loading-state');
        element.innerHTML = `
            <span class="loading-spinner-inline"></span>
            <span>${element.dataset.loadingText || 'Processing...'}</span>
        `;

        // Store reference
        this.activeLoadings.set(loadingId, {
            element,
            originalContent,
            originalDisabled,
            type: 'inline'
        });

        return loadingId;
    }

    /**
     * Hide inline loading
     * @param {string} loadingId
     */
    hideInline(loadingId) {
        const loading = this.activeLoadings.get(loadingId);
        if (!loading || loading.type !== 'inline') return;

        const { element, originalContent, originalDisabled } = loading;
        
        element.innerHTML = originalContent;
        element.disabled = originalDisabled;
        element.classList.remove('loading-state');
        
        this.activeLoadings.delete(loadingId);
    }

    /**
     * Auto-hide loading after minimum duration
     * @param {string} loadingId
     * @param {number} minDuration - Minimum duration in ms
     */
    async autoHide(loadingId, minDuration = 500) {
        const loading = this.activeLoadings.get(loadingId) || this.globalLoading;
        if (!loading) return;

        const elapsed = Date.now() - loading.startTime;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }

        if (loading === this.globalLoading) {
            this.hide();
        } else if (loading.type === 'inline') {
            this.hideInline(loadingId);
        } else {
            this.hideOn(loadingId);
        }
    }

    /**
     * Wrap async function with loading
     * @param {Function} fn - Async function
     * @param {object} options - Loading options
     */
    async wrap(fn, options = {}) {
        const config = {
            type: 'global', // global, element, inline
            target: null,
            text: 'Loading...',
            minDuration: 500,
            ...options
        };

        let loadingId;

        try {
            // Show loading
            if (config.type === 'global') {
                loadingId = this.show(config.text);
            } else if (config.type === 'inline') {
                loadingId = this.showInline(config.target);
            } else if (config.type === 'element') {
                loadingId = this.showOn(config.target, config);
            }

            // Execute function
            const result = await fn();

            // Auto-hide with minimum duration
            if (loadingId) {
                await this.autoHide(loadingId, config.minDuration);
            }

            return result;

        } catch (error) {
            // Hide loading on error
            if (loadingId) {
                if (config.type === 'global') {
                    this.hide();
                } else if (config.type === 'inline') {
                    this.hideInline(loadingId);
                } else {
                    this.hideOn(loadingId);
                }
            }
            throw error;
        }
    }

    _generateId() {
        return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const appLoading = new AppLoading();
