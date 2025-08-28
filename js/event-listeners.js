import { State } from './state.js';

/**
 * Centralizes all event listener attachments.
 */
export const EventListeners = {
    init() {
        window.UI.elements.setupForm.addEventListener('submit', this.handleSetupSubmit);
        window.UI.elements.setupForm.addEventListener('change', this.handleThemePreview);
        window.UI.elements.importSetupBtn.addEventListener('click', () => window.UI.elements.importUserDataInput.click());

        window.UI.elements.newWorkoutBtn.addEventListener('click', () => window.UI.openEditor());
        window.UI.elements.importWorkoutBtn.addEventListener('click', () => window.UI.elements.importWorkoutFileInput.click());
        window.UI.elements.importWorkoutFileInput.addEventListener('change', this.handleImportWorkoutFile);
        window.UI.elements.mainSettingsBtn.addEventListener('click', this.openMainSettings.bind(this));
        window.UI.elements.searchBar.addEventListener('input', () => window.UI.renderWorkouts());
        window.UI.elements.sortSelect.addEventListener('change', () => window.UI.renderWorkouts());

        window.UI.elements.workoutList.addEventListener('click', this.handleWorkoutCardAction);
    window.UI.elements.stepsList.addEventListener('click', this.handleStepAction);
    window.UI.elements.stepsList.addEventListener('click', this.handleMediaButtons.bind(this));
    window.UI.elements.editorScreen.addEventListener('click', this.handleMediaButtons.bind(this));
        
        window.UI.elements.saveWorkoutBtn.addEventListener('click', () => window.WorkoutManager.save());
        window.UI.elements.cancelEditorBtn.addEventListener('click', () => window.UI.closeEditor());
        window.UI.elements.addWorkStepBtn.addEventListener('click', () => window.UI.addStepToEditor('work'));
        window.UI.elements.addRestStepBtn.addEventListener('click', () => window.UI.addStepToEditor('rest'));
        
        window.UI.elements.mainSettingsForm.addEventListener('submit', this.handleSaveSettings.bind(this));
        window.UI.elements.settingsTheme.addEventListener('change', this.handleThemePreview.bind(this));
        
        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', (e) => this.handleModalClose(e)));
        window.UI.elements.exportUserDataBtn.addEventListener('click', () => window.UserDataManager.export());
        window.UI.elements.importUserDataBtn.addEventListener('click', () => window.UI.elements.importUserDataInput.click());
        window.UI.elements.importUserDataInput.addEventListener('change', (e) => this.handleImportUserDataFile(e));

        window.UI.elements.timerPauseResumeBtn.addEventListener('click', () => window.Timer.pauseResume());
        window.UI.elements.timerQuitBtn.addEventListener('click', () => window.Timer.quit());
        window.UI.elements.timerDoneBtn.addEventListener('click', () => window.Timer.runNextStep());
        window.UI.elements.timerSkipBtn.addEventListener('click', () => window.Timer.skip());
        window.UI.elements.timerPrevBtn.addEventListener('click', () => window.Timer.prev());
        window.UI.elements.timerProgressBtn.addEventListener('click', () => window.Modal.showWorkoutProgress());
        window.UI.elements.timerFullscreenBtn.addEventListener('click', this.handleFullscreenToggle);
        document.addEventListener('fullscreenchange', () => window.UI.updateFullscreenButton());
    },

    handleMediaButtons(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action !== 'upload-media' && action !== 'clear-media') return;
        e.preventDefault();
        e.stopPropagation();

        if (action === 'clear-media') {
            const targetInputId = btn.dataset.targetInput;
            if (targetInputId) {
                const input = document.getElementById(targetInputId);
                if (input) input.value = '';
            } else {
                const input = btn.closest('.form-group').querySelector('.step-media');
                if (input) input.value = '';
            }
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files?.[0];
            document.body.removeChild(fileInput);
            if (!file) return;
            try {
                const msUrl = await window.MediaStore.putFile(file);
                const targetInputId = btn.dataset.targetInput;
                if (targetInputId) {
                    const input = document.getElementById(targetInputId);
                    if (input) input.value = msUrl;
                } else {
                    const input = btn.closest('.form-group').querySelector('.step-media');
                    if (input) input.value = msUrl;
                }
                window.Notifications?.success?.('Media added. It will be available offline.');
            } catch (err) {
                window.Notifications?.error?.('Failed to store media.');
            }
        });
        fileInput.click();
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
    
    updateStepButtonVisibility() {
        const stepItems = document.querySelectorAll('#stepsList .step-item');
        stepItems.forEach((stepEl, index) => {
            const moveUpBtn = stepEl.querySelector('[data-action="move-up"]');
            const moveDownBtn = stepEl.querySelector('[data-action="move-down"]');
            
            if (index === 0) {
                moveUpBtn.classList.add('hidden');
                moveUpBtn.setAttribute('aria-hidden', 'true');
            } else {
                moveUpBtn.classList.remove('hidden');
                moveUpBtn.setAttribute('aria-hidden', 'false');
            }
            
            if (index === stepItems.length - 1) {
                moveDownBtn.classList.add('hidden');
                moveDownBtn.setAttribute('aria-hidden', 'true');
            } else {
                moveDownBtn.classList.remove('hidden');
                moveDownBtn.setAttribute('aria-hidden', 'false');
            }
        });
    },
    
    handleStepAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const stepEl = target.closest('.step-item');
        const action = target.dataset.action;
        
        if (action === 'delete') {
            e.preventDefault();
            e.stopPropagation();
            stepEl.style.transform = 'scale(0.95)';
            stepEl.style.opacity = '0';
            setTimeout(() => {
                stepEl.remove();
                window.EventListeners.updateStepButtonVisibility();
            }, 300);
            return;
        }
        
        if (action === 'move-up' || action === 'move-down') {
            e.preventDefault();
            e.stopPropagation();
            window.EventListeners.simpleStepReorder(stepEl, action);
        }
    },

    simpleStepReorder(stepEl, direction) {
        const targetSibling = direction === 'move-up' ? stepEl.previousElementSibling : stepEl.nextElementSibling;
        if (!targetSibling) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        const stepData = window.EventListeners.extractStepFormData(stepEl);
        const targetData = window.EventListeners.extractStepFormData(targetSibling);
        
        stepEl.style.transition = 'transform 0.2s ease, background-color 0.2s ease';
        stepEl.style.transform = 'scale(1.02)';
        stepEl.style.backgroundColor = 'color-mix(in srgb, var(--bg-tertiary), var(--accent-primary) 8%)';
        
        if (direction === 'move-up') {
            stepEl.parentNode.insertBefore(stepEl, targetSibling);
        } else {
            stepEl.parentNode.insertBefore(targetSibling, stepEl);
        }
        
        window.EventListeners.restoreStepFormData(stepEl, stepData);
        window.EventListeners.restoreStepFormData(targetSibling, targetData);
        
        setTimeout(() => {
            stepEl.style.transform = '';
            stepEl.style.backgroundColor = '';
            setTimeout(() => {
                stepEl.style.transition = '';
            }, 200);
        }, 150);
        
        window.EventListeners.updateStepButtonVisibility();
        
        window.scrollTo({
            top: scrollTop,
            behavior: 'auto'
        });
        
        const stepName = stepData.name || 'Unnamed step';
        const announcement = `${stepName} moved ${direction === 'move-up' ? 'up' : 'down'}`;
        window.EventListeners.announceToScreenReader(announcement);
    },



    extractStepFormData(stepEl) {
        return {
            name: stepEl.querySelector('.step-name').value,
            description: stepEl.querySelector('.step-description').value,
            duration: stepEl.querySelector('.step-duration').value,
            reps: stepEl.querySelector('.step-reps').value,
            media: stepEl.querySelector('.step-media').value
        };
    },

    restoreStepFormData(stepEl, data) {
        stepEl.querySelector('.step-name').value = data.name;
        stepEl.querySelector('.step-description').value = data.description;
        stepEl.querySelector('.step-duration').value = data.duration;
        stepEl.querySelector('.step-reps').value = data.reps;
        stepEl.querySelector('.step-media').value = data.media;
    },

    announceToScreenReader(message) {
        let announcer = document.getElementById('step-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'step-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            document.body.appendChild(announcer);
        }
        announcer.textContent = message;
    },

    openMainSettings() {
        this.originalTheme = State.settings.theme;
        
        window.UI.elements.settingsUsername.value = State.settings.username;
        window.UI.elements.settingsTheme.value = State.settings.theme;
        window.UI.elements.settingsView.value = State.settings.view;
        
        const themeDropdown = document.querySelector('[data-original-id="settingsTheme"]');
        const viewDropdown = document.querySelector('[data-original-id="settingsView"]');
        
        if (themeDropdown) {
            window.Dropdown.updateFromSelect(themeDropdown, window.UI.elements.settingsTheme);
        }
        if (viewDropdown) {
            window.Dropdown.updateFromSelect(viewDropdown, window.UI.elements.settingsView);
        }
        
        window.UI.show(window.UI.elements.mainSettingsModal);
        this.addSettingsModalHandlers();
    },

    handleSaveSettings(e) {
        e.preventDefault();
        State.settings.username = window.UI.elements.settingsUsername.value.trim();
        State.settings.theme = window.UI.elements.settingsTheme.value;
        State.settings.view = window.UI.elements.settingsView.value;
        State.save();
        window.UI.applySettings();
        window.UI.renderWorkouts();
        
        this.originalTheme = null;
        this.removeSettingsModalHandlers();
        window.UI.closeAllModals();
    },
    
    handleFullscreenToggle() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                window.Notifications.error(`Error enabling full-screen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    },

    handleThemePreview(e) {
        document.body.dataset.theme = e.target.value;
    },

    addSettingsModalHandlers() {
        const modal = window.UI.elements.mainSettingsModal;
        this.removeSettingsModalHandlers();
        
        this.settingsOverlayClickHandler = (e) => {
            if (e.target === modal) {
                this.handleModalClose(e);
            }
        };
        
        this.settingsEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleModalClose(e);
            }
        };
        
        modal.addEventListener('click', this.settingsOverlayClickHandler);
        document.addEventListener('keydown', this.settingsEscapeHandler);
    },

    removeSettingsModalHandlers() {
        const modal = window.UI.elements.mainSettingsModal;
        
        if (this.settingsOverlayClickHandler) {
            modal.removeEventListener('click', this.settingsOverlayClickHandler);
            this.settingsOverlayClickHandler = null;
        }
        
        if (this.settingsEscapeHandler) {
            document.removeEventListener('keydown', this.settingsEscapeHandler);
            this.settingsEscapeHandler = null;
        }
    },

    handleModalClose(e) {
        const modal = e.target.closest('.modal-overlay');
        if (modal && modal.id === 'mainSettingsModal') {
            if (this.originalTheme && document.body.dataset.theme !== this.originalTheme) {
                document.body.dataset.theme = this.originalTheme;
                
                const themeDropdown = document.querySelector('[data-original-id="settingsTheme"]');
                if (themeDropdown) {
                    window.UI.elements.settingsTheme.value = this.originalTheme;
                    window.Dropdown.updateFromSelect(themeDropdown, window.UI.elements.settingsTheme);
                }
            }
            
            this.removeSettingsModalHandlers();
        }
        window.UI.closeAllModals();
    }
};