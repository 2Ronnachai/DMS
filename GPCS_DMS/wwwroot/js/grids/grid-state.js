/**
 * GridStateManager - จัดการ State ของ Grid (localStorage)
 */
class GridStateManager {
    constructor(gridId, enabled = true) {
        this.gridId = gridId;
        this.enabled = enabled;
        this.stateStorageKey = `gridState_${gridId}`;
    }

    save(state) {
        if (!this.enabled) return;
        
        try {
            localStorage.setItem(this.stateStorageKey, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save grid state:', e);
        }
    }

    load() {
        if (!this.enabled) return null;
        
        try {
            const state = localStorage.getItem(this.stateStorageKey);
            return state ? JSON.parse(state) : null;
        } catch (e) {
            console.error('Failed to load grid state:', e);
            return null;
        }
    }

    clear() {
        if (!this.enabled) return;
        
        try {
            localStorage.removeItem(this.stateStorageKey);
        } catch (e) {
            console.error('Failed to clear grid state:', e);
        }
    }

    hasState() {
        if (!this.enabled) return false;
        return localStorage.getItem(this.stateStorageKey) !== null;
    }
}
