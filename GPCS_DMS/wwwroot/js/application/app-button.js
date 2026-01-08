class AppButton {
    constructor(appMain) {
        this.appMain = appMain;
        this.topContainer = document.getElementById('topActionButtons');
        this.bottomContainer = document.getElementById('bottomActionButtons');
        
        // Define all possible actions
        this.actionDefinitions = {
            back: {
                label: 'Back',
                icon: 'fa-solid fa-arrow-left',
                class: 'dialog-btn-cancel',
                align: 'left',
                handler: () => this.appMain.actionHandler.back()
            },
            save: {
                label: 'Save',
                icon: 'fa-solid fa-floppy-disk',
                class: 'dialog-info dialog-btn-ok',
                align: 'right',
                handler: () => this.appMain.actionHandler.save()
            },
            submit: {
                label: 'Submit',
                icon: 'fa-solid fa-paper-plane',
                class: 'dialog-confirm dialog-btn-ok',
                align: 'right',
                handler: () => this.appMain.actionHandler.submit()
            },
            approve: {
                label: 'Approve',
                icon: 'fa-solid fa-circle-check',
                class: 'dialog-confirm dialog-btn-ok',
                align: 'right',
                handler: () => this.appMain.actionHandler.approve()
            },
            reject: {
                label: 'Reject',
                icon: 'fa-solid fa-circle-xmark',
                class: 'dialog-danger dialog-btn-ok',
                align: 'right',
                handler: () => this.appMain.actionHandler.reject()
            },
            return: {
                label: 'Return',
                icon: 'fa-solid fas fa-undo-alt',
                class: 'dialog-btn-cancel',
                align: 'right',
                handler: () => this.appMain.actionHandler.return()
            },
            cancel: {
                label: 'Cancel',
                icon: 'fa-solid fa-ban',
                class: 'dialog-btn-cancel',
                align: 'right',
                handler: () => this.appMain.actionHandler.cancel()
            }
        };
    }

    render() {
        this._renderButtons(this.topContainer);
        this._renderButtons(this.bottomContainer);
    }

    _renderButtons(container) {
        if(!container) return;

        // Clear existing buttons
        container.innerHTML = '';
        container.className = 'mb-3 d-flex gap-2';

        // Get available actions base on mode
        const actions = this.appMain.avaiableActions;

        if(actions.length === 0){
            // Default: Show only 'Cancel'/'Back' button in view mode
            this._createButon(container, 'back');
            return;
        }

        const leftActions = actions.filter(name =>
            this.actionDefinitions[name] && this.actionDefinitions[name].align === 'left'
        );

        const rightActions = actions.filter(name =>
            this.actionDefinitions[name] && this.actionDefinitions[name].align === 'right'
        );

        // Render left-aligned buttons
        leftActions.forEach(actionKey => {
            this._createButon(container, actionKey);
        });

        if(leftActions.length > 0 && rightActions.length > 0){
            const spacer = document.createElement('div');
            spacer.style.flexGrow = '1';
            container.appendChild(spacer);
        }

        // Render right-aligned buttons
        rightActions.forEach(actionKey => {
            this._createButon(container, actionKey);
        });
    }

    _createButon(container, actionKey) {
        const action = this.actionDefinitions[actionKey];
        if(!action) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `dialog-btn ${action.class || 'dialog-btn-cancel'}`;
        button.dataset.action = actionKey;

        button.innerHTML = `
            <i class="${action.icon} me-1" aria-hidden="true"></i>
            <span>${action.label}</span>
        `;

        button.addEventListener('click', async (e) =>{
            e.preventDefault();
            await action.handler();
        });

        container.appendChild(button);
    }

    // Update buttons when mode changes
    update() {
        this.render();
    }

    // Disable/Enable all buttons
    setEnabled(enabled) {
        const buttons = [
            ...this.topContainer.querySelectorAll('button'),
            ...this.bottomContainer.querySelectorAll('button')
        ];

        buttons.forEach(btn => {
            btn.disabled = !enabled;
        });
    }
}