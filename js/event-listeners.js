import { State } from './state.js';

/**
 * Centralizes all event listener attachments.
 */
export const EventListeners = {
    init() {
        // Setup
        window.UI.elements.setupForm.addEventListener('submit', this.handleSetupSubmit);
        window.UI.elements.importSetupBtn.addEventListener('click', () => window.UI.elements.importUserDataInput.click());

        // Home Screen
        window.UI.elements.newWorkoutBtn.addEventListener('click', () => window.UI.openEditor());
        window.UI.elements.importWorkoutBtn.addEventListener('click', () => window.UI.elements.importWorkoutFileInput.click());
        window.UI.elements.importWorkoutFileInput.addEventListener('change', this.handleImportWorkoutFile);
        window.UI.elements.mainSettingsBtn.addEventListener('click', this.openMainSettings);
        window.UI.elements.searchBar.addEventListener('input', () => window.UI.renderWorkouts());
        window.UI.elements.sortSelect.addEventListener('change', () => window.UI.renderWorkouts());

        // Event Delegation for dynamic content
        window.UI.elements.workoutList.addEventListener('click', this.handleWorkoutCardAction);
        window.UI.elements.stepsList.addEventListener('click', this.handleStepAction);
        
        // Editor
        window.UI.elements.saveWorkoutBtn.addEventListener('click', () => window.WorkoutManager.save());
        window.UI.elements.cancelEditorBtn.addEventListener('click', () => window.UI.closeEditor());
        window.UI.elements.addWorkStepBtn.addEventListener('click', () => window.UI.addStepToEditor('work'));
        window.UI.elements.addRestStepBtn.addEventListener('click', () => window.UI.addStepToEditor('rest'));
        
        // Modals & User Data
        window.UI.elements.mainSettingsForm.addEventListener('submit', this.handleSaveSettings);
        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => window.UI.closeAllModals()));
        window.UI.elements.exportUserDataBtn.addEventListener('click', () => window.UserDataManager.export());
        window.UI.elements.importUserDataBtn.addEventListener('click', () => window.UI.elements.importUserDataInput.click());
        window.UI.elements.importUserDataInput.addEventListener('change', (e) => this.handleImportUserDataFile(e));

        // Timer
        window.UI.elements.timerPauseResumeBtn.addEventListener('click', () => window.Timer.pauseResume());
        window.UI.elements.timerQuitBtn.addEventListener('click', () => window.Timer.quit());
        window.UI.elements.timerDoneBtn.addEventListener('click', () => window.Timer.runNextStep());
        window.UI.elements.timerSkipBtn.addEventListener('click', () => window.Timer.skip());
        window.UI.elements.timerPrevBtn.addEventListener('click', () => window.Timer.prev());
        window.UI.elements.timerFullscreenBtn.addEventListener('click', this.handleFullscreenToggle);
        document.addEventListener('fullscreenchange', () => window.UI.updateFullscreenButton());
    },

    handleSetupSubmit(e) {
        e.preventDefault();
        State.settings.username = window.UI.elements.setupUsername.value.trim();
        State.settings.theme = document.querySelector('input[name="theme"]:checked').value;
        if (State.settings.username) {
            State.save();
            window.UI.applySettings();
            window.UI.renderWorkouts();
            window.UI.hide(window.UI.elements.setupScreen);
            window.UI.show(window.UI.elements.homeScreen);
        }
    },

    handleImportWorkoutFile(e) {
        const file = e.target.files[0];
        if (file) window.WorkoutManager.importWorkout(file);
        e.target.value = '';
    },

    handleImportUserDataFile(e) {
        const file = e.target.files[0];
        const isFromSetup = !window.UI.elements.setupScreen.classList.contains('hidden');
        if (file) window.UserDataManager.import(file, isFromSetup);
        e.target.value = '';
    },

    handleWorkoutCardAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const workoutId = target.closest('.workout-card').dataset.id;
        const actions = {
            start: () => window.Timer.start(workoutId),
            edit: () => window.UI.openEditor(window.WorkoutManager.find(workoutId)),
            favorite: () => window.WorkoutManager.toggleFavorite(workoutId),
            duplicate: () => window.WorkoutManager.duplicate(workoutId),
            exportWorkout: () => window.WorkoutManager.exportWorkout(workoutId),
            delete: () => window.WorkoutManager.delete(workoutId),
            preview: () => window.WorkoutManager.showPreview(workoutId)
        };
        if (actions[action]) actions[action]();
    },
    
    handleStepAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const stepEl = target.closest('.step-item');
        const action = target.dataset.action;
        
        if (action === 'move-up' && stepEl.previousElementSibling) {
            stepEl.parentNode.insertBefore(stepEl, stepEl.previousElementSibling);
        } else if (action === 'move-down' && stepEl.nextElementSibling) {
            stepEl.parentNode.insertBefore(stepEl.nextElementSibling, stepEl);
        } else if (action === 'delete') {
            stepEl.remove();
        }
    },

    openMainSettings() {
        window.UI.elements.settingsUsername.value = State.settings.username;
        window.UI.elements.settingsTheme.value = State.settings.theme;
        window.UI.elements.settingsView.value = State.settings.view;
        window.UI.show(window.UI.elements.mainSettingsModal);
    },

    handleSaveSettings(e) {
        e.preventDefault();
        State.settings.username = window.UI.elements.settingsUsername.value.trim();
        State.settings.theme = window.UI.elements.settingsTheme.value;
        State.settings.view = window.UI.elements.settingsView.value;
        State.save();
        window.UI.applySettings();
        window.UI.renderWorkouts();
        window.UI.closeAllModals();
    },
    
    handleFullscreenToggle() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error enabling full-screen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
};