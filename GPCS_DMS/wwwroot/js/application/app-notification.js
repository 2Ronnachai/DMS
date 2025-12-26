// app-notification.js
class AppNotification {
    constructor(){
        if(AppNotification.instance){
            return AppNotification.instance;
        }

        AppNotification.instance = this;
        this.container = null;
        this.notifications = [];
        this.config ={
            position: 'top-right', // top-left, top-right, bottom-left, bottom-right
            duration: 5000, // in milliseconds
            maxStack: 5,
            animationDuration: 300 // in milliseconds
        };

        this._init();
    }

    _init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = `notification-container ${this.config.position}`;
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type: success, error, warning, info
     * @param {object} options - Additional options
     */
    show(message, type = 'info', options = {}) {
        const config = { ...this.config, ...options };
        
        // Remove oldest if exceeds max stack
        if (this.notifications.length >= this.config.maxStack) {
            this._remove(this.notifications[0]);
        }

        const notification = this._create(message, type, config);
        this.notifications.push(notification);
        this.container.appendChild(notification.element);

        // Trigger animation
        setTimeout(() => notification.element.classList.add('show'), 10);

        // Auto remove
        if (config.duration !== 0) {
            notification.timeout = setTimeout(() => {
                this._remove(notification);
            }, config.duration || config.defaultDuration);
        }

        return notification;
    }

    _create(message, type, config) {
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        
        const icon = this._getIcon(type);
        
        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
                </svg>
            </button>
        `;

        const notification = {
            element,
            type,
            timeout: null
        };

        // Close button handler
        element.querySelector('.notification-close').addEventListener('click', () => {
            this._remove(notification);
        });

        return notification;
    }

    _remove(notification) {
        if (!notification || !notification.element) return;

        notification.element.classList.remove('show');
        
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }

        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, this.config.animationDuration);
    }

    _getIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M0 20H20L10 0L0 20ZM11 17H9V15H11V17ZM11 13H9V9H11V13Z" fill="currentColor"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/></svg>'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    clear() {
        this.notifications.forEach(notification => this._remove(notification));
    }
}

// Singleton instance
const appNotification = new AppNotification();