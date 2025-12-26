/**
 * Dialog System - 和風デザイン (Japanese Design)
 * Simple, Clean, Functional
 */
class AppDialog {
    constructor() {
        if (AppDialog.instance) {
            return AppDialog.instance;
        }
        
        AppDialog.instance = this;
        this.activeDialog = null;
        this.config = {
            animationDuration: 250,
            closeOnOverlayClick: true,
            closeOnEscape: true
        };
        
        this._initEventListeners();
    }

    _initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.config.closeOnEscape && this.activeDialog) {
                this._handleCancel();
            }
        });
    }

    /**
     * Show confirm dialog
     * @param {object} options - Dialog options
     * @returns {Promise<boolean>} - true if OK, false if Cancel
     */
    confirm(options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: 'Confirmation',
                message: 'Are you sure you want to proceed?',
                type: 'confirm', // confirm, warning, danger, info
                okText: 'Confirm',
                cancelText: 'Cancel',
                showCancel: true,
                ...options
            };

            this._show(config, resolve);
        });
    }

    /**
     * Show alert dialog (OK only)
     */
    alert(options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: 'Alert',
                message: '',
                type: 'info',
                okText: 'OK',
                showCancel: false,
                ...options
            };

            this._show(config, resolve);
        });
    }

    /**
     * Show custom dialog
     */
    show(options = {}) {
        return new Promise((resolve) => {
            this._show(options, resolve);
        });
    }

    _show(config, resolve) {
        // Close existing dialog
        if (this.activeDialog) {
            this._close(false);
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        if (this.config.closeOnOverlayClick) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this._handleCancel();
                }
            });
        }

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = `dialog dialog-${config.type || 'confirm'}`;
        
        // Build dialog content
        dialog.innerHTML = `
            ${config.title ? `<div class="dialog-header">
                <h3 class="dialog-title">${config.title}</h3>
            </div>` : ''}
            
            <div class="dialog-body">
                ${config.icon ? `<div class="dialog-icon">${this._getIcon(config.type)}</div>` : ''}
                <div class="dialog-message">${config.message}</div>
            </div>
            
            <div class="dialog-footer">
                <button class="dialog-btn dialog-btn-ok" data-action="ok">
                    ${config.okText || 'OK'}
                </button>
                ${config.showCancel !== false ? `
                    <button class="dialog-btn dialog-btn-cancel" data-action="cancel">
                        ${config.cancelText || 'Cancel'}
                    </button>
                ` : ''}
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Store reference
        this.activeDialog = {
            overlay,
            dialog,
            resolve,
            config
        };

        // Bind button events
        dialog.querySelector('[data-action="ok"]').addEventListener('click', () => this._handleOk());
        const cancelBtn = dialog.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this._handleCancel());
        }

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            dialog.classList.add('show');
        });

        // Focus OK button
        setTimeout(() => {
            dialog.querySelector('[data-action="ok"]').focus();
        }, this.config.animationDuration);
    }

    _handleOk() {
        this._close(true);
    }

    _handleCancel() {
        this._close(false);
    }

    _close(result) {
        if (!this.activeDialog) return;

        const { overlay, dialog, resolve } = this.activeDialog;

        // Remove show class
        overlay.classList.remove('show');
        dialog.classList.remove('show');

        // Remove from DOM after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.activeDialog = null;
            resolve(result);
        }, this.config.animationDuration);
    }

    _getIcon(type) {
        const icons = {
            confirm: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/></svg>',
            warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/></svg>',
            danger: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/></svg>',
            info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/></svg>'
        };
        return icons[type] || icons.info;
    }
}

// Create singleton instance
const appDialog = new AppDialog();
