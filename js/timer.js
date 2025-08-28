import { State } from './state.js';

/**
 * Manages the timer logic, including starting, pausing, and navigating steps.
 */
export const Timer = {
    async acquireWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                State.timer.wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
            }
        }
    },
    releaseWakeLock() {
        State.timer.wakeLock?.release();
        State.timer.wakeLock = null;
    },

    start(workoutId) {
        const workout = window.WorkoutManager.find(workoutId);
        if (!workout) return;

        State.timer.currentWorkout = workout;
        State.timer.executionQueue = this.buildExecutionQueue(workout);
        State.timer.currentIndex = -1;
        State.timer.state = 'running';
        
        this.acquireWakeLock();
        window.UI.hide(window.UI.elements.homeScreen);
        window.UI.show(window.UI.elements.timerScreen);
        
        this.runNextStep();
    },

    buildExecutionQueue(workout) {
        const queue = [];
        if (workout.prepare > 0) queue.push({ type: 'prepare' });
        for (let i = 0; i < workout.sets; i++) {
            workout.steps.forEach((step, stepIndex) => queue.push({ type: 'step', set: i + 1, stepIndex: stepIndex }));
            if (i < workout.sets - 1 && workout.cooldown > 0) queue.push({ type: 'cooldown', set: i + 1 });
        }
        return queue;
    },

    runNextStep() {
        clearInterval(State.timer.interval);
        State.timer.currentIndex++;
        window.UI.updateProgressBar();

        window.UI.elements.timerPrevBtn.disabled = State.timer.currentIndex <= 0;

        if (State.timer.currentIndex >= State.timer.executionQueue.length) {
            this.finish();
            return;
        }

        const currentEvent = State.timer.executionQueue[State.timer.currentIndex];
        const workout = State.timer.currentWorkout;
        let step, data;

        switch(currentEvent.type) {
            case 'prepare':
                data = { category: 'Prepare', name: workout.title, duration: workout.prepare, media: workout.prepareMedia };
                break;
            case 'cooldown':
                data = { category: 'Cooldown', name: workout.title, duration: workout.cooldown, media: workout.cooldownMedia };
                break;
            case 'step':
                step = workout.steps[currentEvent.stepIndex];
                data = { category: step.type, name: step.name, description: step.description, reps: step.reps, duration: step.duration, media: step.media };
                break;
        }

        State.timer.timeLeft = data.duration;
        window.UI.updateTimerUI({ ...data, set: currentEvent.set, stepIndex: currentEvent.stepIndex });
        
        if (State.timer.currentIndex > 0) {
            window.Audio.playTaskStartSound();
        }
        
        if (data.duration > 0) {
            window.UI.hide(window.UI.elements.timerDoneBtn);
            State.timer.interval = setInterval(() => this.tick(), 1000);
        } else {
            window.UI.show(window.UI.elements.timerDoneBtn);
        }
    },

    tick() {
        State.timer.timeLeft--;
        window.UI.elements.timerCountdown.textContent = this.formatTime(State.timer.timeLeft);
        
        if (State.timer.timeLeft <= 3 && State.timer.timeLeft > 0) {
            window.Audio.playCountdownBeep();
        }
        
        if (State.timer.timeLeft <= 0) {
            this.runNextStep();
        }
    },

    pauseResume() {
        const btn = window.UI.elements.timerPauseResumeBtn;
        if (State.timer.state === 'running') {
            State.timer.state = 'paused';
            clearInterval(State.timer.interval);
            btn.textContent = 'Resume';
            this.releaseWakeLock();
        } else if (State.timer.state === 'paused') {
            State.timer.state = 'running';
            if (State.timer.timeLeft > 0) {
                State.timer.interval = setInterval(() => this.tick(), 1000);
            }
            btn.textContent = 'Pause';
            this.acquireWakeLock();
        }
    },

    skip() {
        if (State.timer.state === 'paused') this.pauseResume();
        this.runNextStep();
    },
    
    prev() {
        if (State.timer.currentIndex > 0) {
            if (State.timer.state === 'paused') this.pauseResume();
            State.timer.currentIndex -= 2;
            this.runNextStep();
        }
    },

    async quit() {
        const confirmed = await window.Modal.confirm(
            'Are you sure you want to quit this workout?',
            'Quit Workout'
        );
        
        if (confirmed) {
            clearInterval(State.timer.interval);
            this.releaseWakeLock();
            State.timer.state = 'stopped';
            window.UI.hide(window.UI.elements.timerScreen);
            window.UI.show(window.UI.elements.homeScreen);
        }
    },

    finish() {
        clearInterval(State.timer.interval);
        this.releaseWakeLock();
        window.Modal.showWorkoutComplete({
            title: 'Workout Complete!',
            message: 'Great job! You\'ve successfully completed your workout.',
            confirmText: 'Awesome!'
        });
        State.timer.state = 'stopped';
        window.UI.hide(window.UI.elements.timerScreen);
        window.UI.show(window.UI.elements.homeScreen);
    },

    formatTime(seconds) {
        const min = Math.floor(seconds / 60).toString().padStart(2, '0');
        const sec = (seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }
};