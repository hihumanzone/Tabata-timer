from playwright.sync_api import sync_playwright
import os
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        page.goto(f'file://{file_path}')

        # Set a dummy user in localStorage to bypass the setup screen
        page.evaluate("""
            localStorage.setItem('tabata-timer-settings', JSON.stringify({
                username: 'Test User',
                theme: 'light',
                view: 'grid'
            }));
        """)

        # Reload the page to apply the new state
        page.reload()

        # Wait for the page to load
        page.wait_for_load_state('networkidle')

        # Take a screenshot of the home page to verify the square buttons
        page.screenshot(path='jules-scratch/verification/home_page_square_buttons.png')

        # Open the new workout modal
        page.click('#newWorkoutBtn')
        page.wait_for_selector('#editorScreen:not(.hidden)', state='visible')

        # Add a title and a step
        page.fill('#workoutTitle', 'Test Workout')
        page.click('#addWorkStepBtn')
        page.fill('.step-name', 'Test Step')

        # Save the workout
        page.click('#saveWorkoutBtn')

        # Start the workout
        page.click('.card-start-btn')
        page.wait_for_selector('#timerScreen:not(.hidden)', state='visible')

        # Open the workout progress modal
        page.click('#timerProgressBtn')
        page.wait_for_selector('.workout-progress-modal', state='visible')
        page.screenshot(path='jules-scratch/verification/workout_progress_modal.png')

        browser.close()

if __name__ == '__main__':
    run()
