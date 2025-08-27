import { State } from './state.js';

/**
 * Handles import/export of the entire user profile.
 */
export const UserDataManager = {
    export() {
        const userData = {
            settings: State.settings,
            workouts: State.workouts
        };
        const dataStr = JSON.stringify(userData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tabata_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    import(file, isFromSetup = false) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const userData = JSON.parse(event.target.result);
                if (userData.settings && Array.isArray(userData.workouts)) {
                    State.settings = userData.settings;
                    State.workouts = userData.workouts;
                    State.save();
                    window.UI.applySettings();
                    window.UI.renderWorkouts();
                    window.UI.closeAllModals();
                    if (isFromSetup) {
                        window.UI.hide(window.UI.elements.setupScreen);
                        window.UI.show(window.UI.elements.homeScreen);
                    }
                    window.Notifications.success('User data imported successfully!');
                } else {
                    window.Notifications.error('Invalid user data file format.');
                }
            } catch (err) {
                window.Notifications.error('Error reading file. Make sure it is a valid JSON.');
            }
        };
        reader.readAsText(file);
    }
};