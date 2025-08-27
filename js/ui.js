import { State } from './state.js';
import { Config } from './config.js';

/**
 * Handles all DOM manipulations, rendering, and UI state changes.
 */
export const UI = {
    elements: {},

    cacheDOMElements() {
        const ids = [
            'setupScreen', 'homeScreen', 'editorScreen', 'timerScreen', 'workoutList', 'welcomeMessage',
            'setupForm', 'setupUsername', 'importSetupBtn', 'newWorkoutBtn', 'importWorkoutBtn', 'importWorkoutFileInput',
            'importUserDataInput', 'mainSettingsBtn', 'searchBar', 'sortSelect', 'noWorkoutsMessage',
            'editorTitle', 'workoutForm', 'workoutId', 'workoutTitle', 'workoutDescription',
            'workoutPrepare', 'prepareMedia', 'workoutSets', 'workoutCooldown', 'cooldownMedia',
            'workoutColor', 'colorSelector', 'stepsList', 'saveWorkoutBtn', 'cancelEditorBtn',
            'addWorkStepBtn', 'addRestStepBtn', 'timerCurrentCategory', 'timerCurrentName',
            'timerMediaContainer', 'timerCountdown', 'timerReps', 'timerDescription', 'timerDoneBtn',
            'timerStepProgress', 'timerOverallProgress', 'timerOverallProgressBar', 'timerPauseResumeBtn',
            'timerQuitBtn', 'timerPrevBtn', 'timerSkipBtn', 'timerFullscreenBtn',
            'mainSettingsModal', 'mainSettingsForm', 'settingsUsername', 'settingsTheme',
            'settingsView', 'exportUserDataBtn', 'importUserDataBtn', 'previewModal',
            'previewTitle', 'previewContent'
        ];
        ids.forEach(id => this.elements[id] = document.getElementById(id));
    },

    show: el => el.classList.remove('hidden'),
    hide: el => el.classList.add('hidden'),

    applySettings() {
        document.body.dataset.theme = State.settings.theme;
        this.elements.welcomeMessage.textContent = `Welcome, ${State.settings.username}!`;
        this.elements.workoutList.className = `workout-list ${State.settings.view === 'list' ? 'list-view' : ''}`;
    },

    renderWorkouts() {
        this.elements.workoutList.innerHTML = '';
        const workoutsToRender = window.WorkoutManager.getFilteredAndSorted();
        
        this.elements.noWorkoutsMessage.classList.toggle('hidden', workoutsToRender.length > 0);
        
        workoutsToRender.forEach(workout => {
            const card = this.createWorkoutCard(workout);
            this.elements.workoutList.appendChild(card);
        });
    },

    createWorkoutCard(workout) {
        const template = document.getElementById('workoutCardTemplate');
        const card = template.content.cloneNode(true).firstElementChild;
        card.dataset.id = workout.id;
        card.style.setProperty('--color-tag', Config.colors[workout.color] || 'var(--accent-primary)');
        card.querySelector('.card-title').textContent = workout.title;
        card.querySelector('.card-description').textContent = workout.description || '';
        const favBtn = card.querySelector('.card-favorite-btn');
        favBtn.textContent = workout.isFavorite ? '★' : '☆';
        favBtn.classList.toggle('favorited', workout.isFavorite);
        return card;
    },
    
    openEditor(workout = null) {
        this.elements.workoutForm.reset();
        this.elements.stepsList.innerHTML = '';
        this.buildColorSelector();

        if (workout) {
            this.elements.editorTitle.textContent = 'Edit Workout';
            this.elements.workoutId.value = workout.id;
            this.elements.workoutTitle.value = workout.title;
            this.elements.workoutDescription.value = workout.description;
            this.elements.workoutPrepare.value = workout.prepare;
            this.elements.prepareMedia.value = workout.prepareMedia || '';
            this.elements.workoutSets.value = workout.sets;
            this.elements.workoutCooldown.value = workout.cooldown;
            this.elements.cooldownMedia.value = workout.cooldownMedia || '';
            this.elements.workoutColor.value = workout.color;
            
            document.querySelectorAll('.color-tag').forEach(tag => {
                tag.classList.toggle('selected', tag.dataset.color === workout.color);
            });
            
            workout.steps.forEach(step => this.addStepToEditor(step.type, step));
        } else {
            this.elements.editorTitle.textContent = 'Create Workout';
            this.elements.workoutId.value = '';
            document.querySelector('.color-tag[data-color="blue"]').classList.add('selected');
            this.elements.workoutColor.value = 'blue';
        }

        this.hide(this.elements.homeScreen);
        this.show(this.elements.editorScreen);
    },

    closeEditor() {
        this.hide(this.elements.editorScreen);
        this.show(this.elements.homeScreen);
    },

    addStepToEditor(type, data = {}) {
        const template = document.getElementById('editorStepTemplate');
        const stepEl = template.content.cloneNode(true).firstElementChild;
        
        stepEl.dataset.type = type;
        stepEl.dataset.id = data.id || `s-${Date.now()}`;
        stepEl.querySelector('h4').textContent = `${type} Step`;
        
        stepEl.querySelector('.step-name').value = data.name || '';
        stepEl.querySelector('.step-description').value = data.description || '';
        stepEl.querySelector('.step-duration').value = data.duration !== undefined ? data.duration : (type === 'work' ? 30 : 15);
        stepEl.querySelector('.step-reps').value = data.reps || '';
        stepEl.querySelector('.step-media').value = data.media || '';

        this.elements.stepsList.appendChild(stepEl);
        
        window.EventListeners.updateStepButtonVisibility();
    },

    buildColorSelector() {
        this.elements.colorSelector.innerHTML = '';
        Object.entries(Config.colors).forEach(([name, hex]) => {
            const tag = document.createElement('div');
            tag.className = 'color-tag';
            tag.dataset.color = name;
            tag.style.backgroundColor = hex;
            tag.setAttribute('role', 'radio');
            tag.setAttribute('aria-checked', 'false');
            tag.addEventListener('click', () => {
                const selected = document.querySelector('.color-tag.selected');
                if (selected) {
                    selected.classList.remove('selected');
                    selected.setAttribute('aria-checked', 'false');
                }
                tag.classList.add('selected');
                tag.setAttribute('aria-checked', 'true');
                this.elements.workoutColor.value = name;
            });
            this.elements.colorSelector.appendChild(tag);
        });
    },

    updateTimerUI(data) {
        this.elements.timerScreen.classList.toggle('media-visible', !!data.media?.trim());
        this.elements.timerCurrentCategory.textContent = data.category;
        this.elements.timerCurrentName.textContent = data.name;
        this.elements.timerDescription.textContent = data.description || '';
        
        this.elements.timerReps.classList.toggle('hidden', !data.reps > 0);
        if (data.reps > 0) this.elements.timerReps.textContent = `${data.reps} Reps`;

        const mediaContainer = this.elements.timerMediaContainer;
        if (data.media?.trim()) {
            this.show(mediaContainer);
            mediaContainer.innerHTML = '';
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(data.media)) {
                mediaContainer.innerHTML = `<img src="${data.media}" alt="${data.name}">`;
            } else if (/\.(mp4|webm|ogv)$/i.test(data.media)) {
                mediaContainer.innerHTML = `<video src="${data.media}" autoplay muted loop playsinline></video>`;
            }
        } else {
            this.hide(mediaContainer);
        }
        
        const timerEl = this.elements.timerCountdown;
        if (data.duration > 0) {
            this.show(timerEl);
            timerEl.textContent = window.Timer.formatTime(State.timer.timeLeft);
        } else {
            this.hide(timerEl);
        }
        
        let progressText = '';
        if (data.set) {
            progressText += `Set ${data.set} of ${State.timer.currentWorkout.sets}`;
        }
        const nextEvent = State.timer.executionQueue[State.timer.currentIndex + 1];
        if (nextEvent) {
            let nextName = nextEvent.type === 'step' ? State.timer.currentWorkout.steps[nextEvent.stepIndex].name : nextEvent.type;
            progressText += ` • Up Next: ${nextName}`;
        } else {
            progressText += ' • Final step!';
        }
        this.elements.timerStepProgress.textContent = progressText;
    },

    updateProgressBar() {
        const totalEvents = State.timer.executionQueue.length;
        const completedEvents = State.timer.currentIndex;
        const percentage = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
        this.elements.timerOverallProgressBar.style.width = `${percentage}%`;
        this.elements.timerOverallProgress.setAttribute('aria-valuenow', Math.round(percentage));
    },

    updateFullscreenButton() {
        const btn = this.elements.timerFullscreenBtn;
        btn.textContent = document.fullscreenElement ? 'Exit Fullscreen ↙️' : 'Fullscreen ↗️';
    },

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => this.hide(modal));
    }
};