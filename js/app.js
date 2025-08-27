import { ViewportManager } from './viewport-manager.js';
import { UI } from './ui.js';
import { State } from './state.js';
import { Config } from './config.js';
import { Timer } from './timer.js';
import { WorkoutManager } from './workout-manager.js';
import { UserDataManager } from './user-data-manager.js';
import { EventListeners } from './event-listeners.js';
import { Modal } from './modal.js';
import { Notifications } from './notifications.js';
import { Dropdown } from './dropdown.js';

/**
 * Main application entry point.
 * Initializes all modules and starts the application logic.
 */
export const App = {
    init() {
        window.UI = UI;
        window.State = State;
        window.Config = Config;
        window.Timer = Timer;
        window.WorkoutManager = WorkoutManager;
        window.UserDataManager = UserDataManager;
        window.EventListeners = EventListeners;
        window.ViewportManager = ViewportManager;
        window.Modal = Modal;
        window.Notifications = Notifications;
        window.Dropdown = Dropdown;

        ViewportManager.init();
        UI.cacheDOMElements();
        State.load();
        EventListeners.init();
        
        // Initialize custom components
        Notifications.init();
        Dropdown.replaceAll();

        if (!State.settings.username) {
            UI.show(UI.elements.setupScreen);
        } else {
            UI.applySettings();
            UI.renderWorkouts();
            UI.show(UI.elements.homeScreen);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});