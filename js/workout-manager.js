import { State } from './state.js';
import { Config } from './config.js';

/**
 * Handles CRUD operations and business logic for workouts.
 */
export const WorkoutManager = {
    find: (id) => State.workouts.find(w => w.id === id),
    
    getFilteredAndSorted() {
        let workouts = [...State.workouts];
        const searchTerm = window.UI.elements.searchBar.value.toLowerCase();
        const sortBy = window.UI.elements.sortSelect.value;

        if (searchTerm) {
            workouts = workouts.filter(w => 
                w.title.toLowerCase().includes(searchTerm) || 
                (w.description && w.description.toLowerCase().includes(searchTerm))
            );
        }
        
        workouts.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            switch(sortBy) {
                case 'name-asc': return a.title.localeCompare(b.title);
                case 'name-desc': return b.title.localeCompare(a.title);
                case 'date-new': return b.createdAt - a.createdAt;
                case 'date-old': return a.createdAt - b.createdAt;
                case 'color':
                    return Object.keys(Config.colors).indexOf(a.color) - Object.keys(Config.colors).indexOf(b.color);
                default: return 0;
            }
        });
        return workouts;
    },

    save() {
        const id = window.UI.elements.workoutId.value;
        const title = window.UI.elements.workoutTitle.value.trim();

        if (!title) {
            alert('Workout title cannot be empty.');
            return;
        }
        
        const isTitleDuplicate = State.workouts.some(
            w => w.title.toLowerCase() === title.toLowerCase() && w.id !== id
        );
        if (isTitleDuplicate) {
            alert('A workout with this title already exists. Please choose a unique title.');
            return;
        }

        const steps = Array.from(document.querySelectorAll('#stepsList .step-item')).map(el => ({
            id: el.dataset.id, type: el.dataset.type,
            name: el.querySelector('.step-name').value,
            description: el.querySelector('.step-description').value,
            duration: parseInt(el.querySelector('.step-duration').value, 10) || 0,
            reps: parseInt(el.querySelector('.step-reps').value, 10) || 0,
            media: el.querySelector('.step-media').value,
        }));

        const workoutData = {
            id: id || `w-${Date.now()}`,
            title: title,
            description: window.UI.elements.workoutDescription.value.trim(),
            color: window.UI.elements.workoutColor.value,
            prepare: parseInt(window.UI.elements.workoutPrepare.value, 10) || 0,
            prepareMedia: window.UI.elements.prepareMedia.value.trim(),
            sets: parseInt(window.UI.elements.workoutSets.value, 10),
            cooldown: parseInt(window.UI.elements.workoutCooldown.value, 10) || 0,
            cooldownMedia: window.UI.elements.cooldownMedia.value.trim(),
            steps: steps,
        };
        
        if (workoutData.sets < 1 || workoutData.steps.length === 0) {
            alert('Please have at least 1 Set and add at least one Step.');
            return;
        }

        if (id) {
            const index = State.workouts.findIndex(w => w.id === id);
            const existing = State.workouts[index];
            State.workouts[index] = { ...existing, ...workoutData };
        } else {
            workoutData.createdAt = Date.now();
            workoutData.isFavorite = false;
            State.workouts.push(workoutData);
        }
        
        State.save();
        window.UI.renderWorkouts();
        window.UI.closeEditor();
    },

    toggleFavorite(id) {
        const workout = this.find(id);
        if (workout) {
            workout.isFavorite = !workout.isFavorite;
            State.save();
            window.UI.renderWorkouts();
        }
    },

    duplicate(id) {
        const original = this.find(id);
        if (original) {
            let newTitle = `${original.title} (Copy)`;
            let counter = 2;
            while (State.workouts.some(w => w.title === newTitle)) {
                newTitle = `${original.title} (Copy ${counter++})`;
            }

            const newWorkout = JSON.parse(JSON.stringify(original));
            newWorkout.id = `w-${Date.now()}`;
            newWorkout.title = newTitle;
            newWorkout.isFavorite = false;
            newWorkout.createdAt = Date.now();
            State.workouts.push(newWorkout);
            State.save();
            window.UI.renderWorkouts();
        }
    },
    
    delete(id) {
        if (confirm('Are you sure you want to delete this workout?')) {
            State.workouts = State.workouts.filter(w => w.id !== id);
            State.save();
            window.UI.renderWorkouts();
        }
    },

    exportWorkout(id) {
        const workout = this.find(id);
        if (workout) {
            const dataStr = JSON.stringify(workout, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${workout.title.replace(/\s/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    },

    importWorkout(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workout = JSON.parse(event.target.result);
                if (workout.id && workout.title && Array.isArray(workout.steps)) {
                    if (this.find(workout.id) || State.workouts.some(w => w.title === workout.title)) {
                        workout.id = `w-${Date.now()}`;
                        workout.title = `${workout.title} (Imported)`;
                    }
                    State.workouts.push(workout);
                    State.save();
                    window.UI.renderWorkouts();
                    alert('Workout imported successfully!');
                } else {
                    alert('Invalid workout file format.');
                }
            } catch (err) {
                alert('Error reading file. Make sure it is a valid JSON.');
            }
        };
        reader.readAsText(file);
    },

    showPreview(id) {
        const workout = this.find(id);
        if (!workout) return;
        
        let html = `
            <h3>${workout.title}</h3>
            <p>${workout.description || 'No description.'}</p>
            <p><strong>Color:</strong> <span style="display:inline-block;width:15px;height:15px;background-color:${Config.colors[workout.color]};border-radius:50%; vertical-align:middle;"></span></p>
            <p><strong>Sets:</strong> ${workout.sets}</p>
            <p><strong>Prepare:</strong> ${workout.prepare}s | <strong>Cooldown:</strong> ${workout.cooldown}s</p>
            <h4>Steps:</h4>
            <ol>`;
        
        workout.steps.forEach(step => {
            html += `<li><strong>${step.name} (${step.type})</strong> - 
                ${step.duration > 0 ? `${step.duration}s` : 'Manual'} 
                ${step.reps > 0 ? `, ${step.reps} reps` : ''}
            </li>`;
        });
        
        html += `</ol>`;
        window.UI.elements.previewContent.innerHTML = html;
        window.UI.show(window.UI.elements.previewModal);
    }
};