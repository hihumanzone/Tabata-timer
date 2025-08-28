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

        # Open the settings modal
        page.click('#mainSettingsBtn')
        page.wait_for_timeout(1000) # wait for 1 second
        page.screenshot(path='jules-scratch/verification/settings_modal.png')

        browser.close()

if __name__ == '__main__':
    run()
