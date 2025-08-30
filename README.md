# Tabata Timer

A highly customizable, offline-first Tabata and interval workout timer built as a Progressive Web App (PWA). Create, manage, and run your workouts with detailed timing controls, custom steps, and a user-friendly interface.

## Features

- **Progressive Web App (PWA)**: Installable on your device for an app-like experience and offline access.
- **Customizable Workouts**: Tailor every aspect of your workout, including prepare times, sets, cooldowns, and individual work/rest steps.
- **Rich Step Details**: Each step can have its own name, description, duration, rep count, and even a custom media URL (image or video) that displays during the timer.
- **Flexible Timer**: A full-screen timer with clear visuals, progress indicators, and controls for pausing, skipping, and quitting.
- **Workout Management**: Easily create, edit, duplicate, favorite, and delete workouts.
- **Search and Sort**: Quickly find the workout you need with search and multiple sorting options.
- **Personalization**: Choose from multiple themes and color palettes to customize the look and feel.
- **Data Portability**: Export and import individual workouts or your entire user profile (settings and all workouts) in a simple JSON format.

## Usage Guide

### 1. First-Time Setup

When you first open the application, you'll be prompted to enter a username and choose a visual theme. You can also import an existing user data file if you have one.

### 2. Home Screen

The home screen displays all your saved workouts. From here you can:
- **Create a new workout**: Click the "New Workout" button.
- **Import a workout**: Click "Import Workout" to load a single workout from a `.json` file.
- **Search and Sort**: Use the search bar and sort dropdown to find specific workouts.
- **Access Settings**: Click the gear icon to change your username, theme, or default workout view (grid/list).
- **Manage User Data**: In the settings modal, you can export your entire user profile or import a previously exported profile.

### 3. Creating and Editing a Workout

The workout editor allows you to define every detail of your routine.

- **General**: Set the workout's title, description, and a color tag for organization.
- **Timing**:
    - **Prepare**: The initial countdown before the first set begins.
    - **Sets**: The total number of times the sequence of steps will be repeated.
    - **Cooldown**: The final period of rest after the last set is complete.
    - **Media URLs**: You can add an image or video URL to be displayed during the prepare and cooldown phases.
- **Steps**:
    - Add **Work** or **Rest** steps to build your routine.
    - For each step, you can define:
        - **Name and Description**.
        - **Duration**: Set in seconds. A duration of `0` creates a manual step that you must end yourself.
        - **Reps**: An optional field to specify the number of repetitions for the step.
        - **Media URL**: An image or video to display during that specific step.
    - You can reorder or delete steps as needed.

### 4. Running a Workout

- **Start a workout**: Click the "Start" button on any workout card.
- **The Timer Screen**:
    - Displays the current phase (Prepare, Work, Rest, Cooldown), step name, and a large countdown timer.
    - A progress bar at the bottom shows your overall progress through the workout.
    - Controls allow you to **Pause/Resume**, **Skip** to the next step, go to the **Previous** step, or **Quit** the workout.

### 5. Managing Individual Workouts

Each workout card has a settings menu (three dots) with the following options:
- **Preview**: See a quick summary of the workout's steps and timings.
- **Edit**: Open the workout in the editor.
- **Duplicate**: Create a copy of the workout.
- **Export Workout**: Save the individual workout as a `.json` file.
- **Delete**: Permanently remove the workout.

## Sample User Data File

You can import and export all your settings and workouts using a single JSON file. This is useful for backups or transferring your data to another device. Here is an example of the data structure:

```json
{
  "settings": {
    "username": "Jules",
    "theme": "dark",
    "palette": "default",
    "view": "grid"
  },
  "workouts": [
    {
      "id": "w-1756567003040",
      "title": "Full-Featured Core",
      "description": "Core workout with all features enabled.",
      "color": "blue",
      "prepare": 5,
      "prepareMedia": "https://gymvisual.com/img/p/4/7/3/1/4731.gif",
      "sets": 2,
      "cooldown": 10,
      "cooldownMedia": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif",
      "steps": [
        {
          "id": "s-1756567002385",
          "type": "work",
          "name": "Sit-ups (Reps)",
          "description": "",
          "duration": 0,
          "reps": 20,
          "media": "https://gymvisual.com/img/p/4/7/3/1/4731.gif"
        },
        {
          "id": "s-1756567002502",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 10,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567002623",
          "type": "work",
          "name": "Crunches (Time)",
          "description": "",
          "duration": 30,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567002773",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 10,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/4/7/3/1/4731.gif"
        },
        {
          "id": "s-1756567002906",
          "type": "work",
          "name": "Extensions (Time+Reps)",
          "description": "",
          "duration": 30,
          "reps": 15,
          "media": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif"
        }
      ],
      "createdAt": 1756567003040,
      "isFavorite": false
    },
    {
      "id": "w-1756567004089",
      "title": "Leg Day Special",
      "description": "A workout for your legs.",
      "color": "yellow",
      "prepare": 10,
      "prepareMedia": "https://gymvisual.com/img/p/4/7/3/1/4731.gif",
      "sets": 3,
      "cooldown": 15,
      "cooldownMedia": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif",
      "steps": [
        {
          "id": "s-1756567003538",
          "type": "work",
          "name": "Squats",
          "description": "",
          "duration": 45,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/4/7/3/1/4731.gif"
        },
        {
          "id": "s-1756567003634",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 15,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567003738",
          "type": "work",
          "name": "Lunges (Reps)",
          "description": "",
          "duration": 0,
          "reps": 15,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567003854",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 15,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif"
        },
        {
          "id": "s-1756567003971",
          "type": "work",
          "name": "Calf Raises (Time+Reps)",
          "description": "",
          "duration": 30,
          "reps": 20,
          "media": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif"
        }
      ],
      "createdAt": 1756567004089,
      "isFavorite": false
    },
    {
      "id": "w-1756567005117",
      "title": "Upper Body Blast",
      "description": "A workout for your upper body.",
      "color": "purple",
      "prepare": 12,
      "prepareMedia": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif",
      "sets": 3,
      "cooldown": 20,
      "cooldownMedia": "https://gymvisual.com/img/p/4/7/3/1/4731.gif",
      "steps": [
        {
          "id": "s-1756567004621",
          "type": "work",
          "name": "Push-ups (Reps)",
          "description": "",
          "duration": 0,
          "reps": 10,
          "media": "https://gymvisual.com/img/p/2/0/8/2/5/20825.gif"
        },
        {
          "id": "s-1756567004739",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 20,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567004851",
          "type": "work",
          "name": "Bicep Curls",
          "description": "",
          "duration": 40,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/5/8/7/9/5879.gif"
        },
        {
          "id": "s-1756567004934",
          "type": "rest",
          "name": "Rest",
          "description": "",
          "duration": 20,
          "reps": 0,
          "media": "https://gymvisual.com/img/p/4/7/3/1/4731.gif"
        },
        {
          "id": "s-1756567005016",
          "type": "work",
          "name": "Shoulder Press (Time+Reps)",
          "description": "",
          "duration": 40,
          "reps": 12,
          "media": "https://gymvisual.com/img/p/4/7/3/1/4731.gif"
        }
      ],
      "createdAt": 1756567005117,
      "isFavorite": false
    }
  ]
}
```
