class DashboardRenderer {
    constructor(config) {
        this.config = config || window.DashboardConfig;
    }

    renderSummaryCard(container, summary, role, currentActive) {
        if (!container || !summary || !role) {
            console.error('Invalid parameters for renderSummaryCard:', { container, summary, role, currentActive });
            return;
        }

        const allowedKeys = this.config.ROLE_CARD_MAPPING[role] || [];

        // filter cards based on role
        const cardsToRender = this.config.SUMMARY_CARD.filter(card =>
            allowedKeys.includes(card.key)
        );

        // Render cards
        container.innerHTML = cardsToRender.map(card => `
            <div class="summary-card ${card.key === currentActive ? 'summary-card--active' : ''}" 
                data-key="${card.key}">
                <div class="summary-title">${card.label}</div>
                <div class="summary-value" data-summary-key="${card.key}">
                    ${summary[card.key] !== undefined ? summary[card.key] : 0}
                </div>
                <div class="summary-tag">${card.hint}</div>
            </div>
        `).join('');
    }

    updateSummaryValues(container, newSummary) {
        if (!container || !newSummary) return;

        Object.keys(newSummary).forEach(key => {
            const el = container.querySelector(`[data-summary-key="${key}"]`);
            if (!el) return;

            const oldValue = parseInt(el.textContent || '0', 10) || 0;
            const newValue = newSummary[key] ?? 0;

            if (oldValue === newValue) {
                el.textContent = newValue;
                return;
            }

            const cssClass = newValue > oldValue ? 'summary-value--up' : 'summary-value--down';
            el.textContent = newValue;
            el.classList.remove('summary-value--up', 'summary-value--down');
            void el.offsetWidth; // restart animation
            el.classList.add(cssClass);

            // Keep the indicator visible a bit longer so users can notice it
            setTimeout(() => el.classList.remove(cssClass), 1500);
        });
    }

    renderEmpty(container, tab) {
        if (!container) {
            console.error('Invalid container for renderEmpty');
            return;
        }

        const message = this.config.EMPTY_MESSAGES[tab] || this.config.EMPTY_MESSAGES.default;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${message.icon}</div>
                <h3 class="empty-state-title">${message.title}</h3>
                <p class="empty-state-description">${message.description}</p>
            </div>
        `;
    }

    highlightActiveCard(container, currentActive) {
        if (!container || !currentActive) {
            console.error('Invalid parameters for highlightActiveCard:', { container, currentActive });
            return;
        }

        const cards = container.querySelectorAll('.summary-card');
        cards.forEach(card => {
            const key = card.dataset.key;
            card.classList.toggle('summary-card--active', key === currentActive);
        });
    }

    getStatusConfig(status) {
        return this.config.APPLICATION_STATUS[status.toLowerCase()] || { class: 'draft', label: status };
    }
}