import { State } from './state.js';

/**
 * Centralizes all event listener attachments.
 */
export const EventListeners = {
    init() {
        // Setup
        window.UI.elements.setupForm.addEventListener('submit', this.handleSetupSubmit);
        window.UI.elements.setupForm.addEventListener('change', this.handleThemePreview);
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
    
    updateStepButtonVisibility() {
        const stepItems = document.querySelectorAll('#stepsList .step-item');
        stepItems.forEach((stepEl, index) => {
            const moveUpBtn = stepEl.querySelector('[data-action="move-up"]');
            const moveDownBtn = stepEl.querySelector('[data-action="move-down"]');
            
            // Hide move-up button for first step
            if (index === 0) {
                moveUpBtn.classList.add('hidden');
                moveUpBtn.setAttribute('aria-hidden', 'true');
            } else {
                moveUpBtn.classList.remove('hidden');
                moveUpBtn.setAttribute('aria-hidden', 'false');
            }
            
            // Hide move-down button for last step
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
        e.preventDefault(); // Prevent any default behaviors
        e.stopPropagation(); // Stop event bubbling
        
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const stepEl = target.closest('.step-item');
        const action = target.dataset.action;
        
        try {
            if (action === 'delete') {
                // Add exit animation before removal
                stepEl.style.transform = 'scale(0.95)';
                stepEl.style.opacity = '0';
                setTimeout(() => {
                    stepEl.remove();
                    window.EventListeners.updateStepButtonVisibility();
                }, 300);
                return;
            }
            
            if (action === 'move-up' || action === 'move-down') {
                window.EventListeners.animateStepReorder(stepEl, action);
            }
        } catch (error) {
            console.error('Error in handleStepAction:', error);
            // Fallback to simple reordering without animation
            window.EventListeners.simpleStepReorder(stepEl, action);
        }
    },

    simpleStepReorder(stepEl, direction) {
        const targetSibling = direction === 'move-up' ? stepEl.previousElementSibling : stepEl.nextElementSibling;
        if (!targetSibling) return;
        
        // Simple DOM reordering without animation
        if (direction === 'move-up') {
            stepEl.parentNode.insertBefore(stepEl, targetSibling);
        } else {
            stepEl.parentNode.insertBefore(targetSibling, stepEl);
        }
        
        // Update button visibility
        window.EventListeners.updateStepButtonVisibility();
    },

    animateStepReorder(stepEl, direction) {
        const targetSibling = direction === 'move-up' ? stepEl.previousElementSibling : stepEl.nextElementSibling;
        
        if (!targetSibling) return; // No valid move
        
        // Prevent multiple simultaneous animations
        if (stepEl.classList.contains('animating') || targetSibling.classList.contains('animating')) {
            return;
        }
        
        try {
            // Store scroll position before reordering
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Store form data BEFORE any DOM manipulation
            const stepData = window.EventListeners.extractStepFormData(stepEl);
            const targetData = window.EventListeners.extractStepFormData(targetSibling);
            
            // Phase 1: Prepare animation - add base animation classes
            stepEl.classList.add('animating', 'moving');
            targetSibling.classList.add('animating', 'target-sliding');
            
            // Phase 2: Start the sliding animation after a brief moment to ensure CSS has applied
            requestAnimationFrame(() => {
                if (direction === 'move-up') {
                    // Moving step slides up, target step slides down to make space
                    stepEl.classList.add('slide-up');
                    targetSibling.classList.add('slide-down');
                } else {
                    // Moving step slides down, target step slides up to make space
                    stepEl.classList.add('slide-down');
                    targetSibling.classList.add('slide-up');
                }
            });
            
            // Phase 3: Wait for the slide animation to complete, then perform DOM reordering
            setTimeout(() => {
                // Perform the actual DOM reordering
                if (direction === 'move-up') {
                    stepEl.parentNode.insertBefore(stepEl, targetSibling);
                } else {
                    stepEl.parentNode.insertBefore(targetSibling, stepEl);
                }
                
                // Phase 4: Clean up slide transforms immediately after DOM manipulation
                stepEl.classList.remove('slide-up', 'slide-down');
                targetSibling.classList.remove('slide-up', 'slide-down');
                
                // Phase 5: Allow elements to settle in new positions
                setTimeout(() => {
                    // Restore form data
                    window.EventListeners.restoreStepFormData(stepEl, stepData);
                    window.EventListeners.restoreStepFormData(targetSibling, targetData);
                    
                    // Phase 6: Final cleanup and state updates
                    setTimeout(() => {
                        // Clean up all animation classes
                        stepEl.classList.remove('moving', 'animating');
                        targetSibling.classList.remove('animating', 'target-sliding');
                        
                        // Update button visibility after reordering
                        window.EventListeners.updateStepButtonVisibility();
                        
                        // Restore scroll position to prevent jumping
                        window.scrollTo({
                            top: scrollTop,
                            behavior: 'auto' // Use auto to prevent additional animation conflicts
                        });
                        
                        // Announce change to screen readers
                        const stepName = stepData.name || 'Unnamed step';
                        const announcement = `${stepName} moved ${direction === 'move-up' ? 'up' : 'down'}`;
                        window.EventListeners.announceToScreenReader(announcement);
                    }, 100); // Allow time for form data restoration
                    
                }, 50); // Brief delay for DOM settling
                
            }, 600); // Match the CSS transition duration (600ms)
            
        } catch (error) {
            console.error('Error in animateStepReorder:', error);
            // Clean up any partial animation state
            [stepEl, targetSibling].forEach(el => {
                if (el) {
                    el.classList.remove('moving', 'animating', 'target-sliding', 'slide-up', 'slide-down');
                }
            });
            // Fallback to simple reordering
            window.EventListeners.simpleStepReorder(stepEl, direction);
        }
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
        // Create a temporary element for screen reader announcements
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
    },

    handleThemePreview(e) {
        if (e.target.name === 'theme') {
            document.body.dataset.theme = e.target.value;
        }
    }
};