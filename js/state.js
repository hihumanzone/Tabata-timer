/**
 * Manages the application's state and data persistence in localStorage.
 */
export const State = {
    settings: {
        username: '',
        theme: 'light',
        palette: 'default',
        view: 'grid'
    },
    workouts: [],
    timer: {
        interval: null,
        wakeLock: null,
        state: 'stopped',
        currentWorkout: null,
        executionQueue: [],
        currentIndex: -1,
        timeLeft: 0,
    },

    save() {
        localStorage.setItem('tabataSettings', JSON.stringify(this.settings));
        localStorage.setItem('tabataWorkouts', JSON.stringify(this.workouts));
    },

    load() {
        const settings = localStorage.getItem('tabataSettings');
        const workouts = localStorage.getItem('tabataWorkouts');
        if (settings) this.settings = JSON.parse(settings);
        if (workouts) this.workouts = JSON.parse(workouts);
    }
};