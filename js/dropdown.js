/**
 * Custom dropdown component to replace native select elements
 * Provides keyboard navigation and consistent styling
 */
export const Dropdown = {
    activeDropdown: null,

    /**
     * Create a custom dropdown from a select element
     * @param {HTMLSelectElement} selectElement - The select element to replace
     * @param {Object} options - Configuration options
     */
    create(selectElement, options = {}) {
        if (!selectElement || selectElement.tagName !== 'SELECT') {
            console.error('Dropdown.create requires a select element');
            return null;
        }

        const {
            placeholder = 'Select an option...',
            searchable = false
        } = options;

        // Create dropdown structure
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';
        dropdown.setAttribute('data-original-id', selectElement.id);

        // Get options from select element
        const options_ = Array.from(selectElement.options).map(option => ({
            value: option.value,
            text: option.textContent,
            selected: option.selected
        }));

        const selectedOption = options_.find(opt => opt.selected);
        const selectedText = selectedOption ? selectedOption.text : placeholder;

        dropdown.innerHTML = `
            <button class="custom-dropdown-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span class="custom-dropdown-text">${selectedText}</span>
                <span class="custom-dropdown-arrow">▼</span>
            </button>
            <div class="custom-dropdown-menu" role="listbox" aria-hidden="true">
                ${options_.map(option => `
                    <div class="custom-dropdown-option" role="option" data-value="${option.value}" ${option.selected ? 'aria-selected="true"' : ''}>
                        ${option.text}
                    </div>
                `).join('')}
            </div>
        `;

        // Replace select element
        selectElement.style.display = 'none';
        selectElement.parentNode.insertBefore(dropdown, selectElement.nextSibling);

        // Set up event listeners
        this.setupEventListeners(dropdown, selectElement);

        return dropdown;
    },

    /**
     * Set up event listeners for dropdown
     */
    setupEventListeners(dropdown, selectElement) {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const options = dropdown.querySelectorAll('.custom-dropdown-option');

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle(dropdown);
        });

        // Option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectOption(dropdown, selectElement, option.dataset.value);
            });
        });

        // Keyboard navigation
        dropdown.addEventListener('keydown', (e) => {
            this.handleKeydown(e, dropdown, selectElement);
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                this.close(dropdown);
            }
        });
    },

    /**
     * Toggle dropdown open/closed
     */
    toggle(dropdown) {
        const isOpen = dropdown.classList.contains('open');
        
        // Close any other open dropdowns
        if (this.activeDropdown && this.activeDropdown !== dropdown) {
            this.close(this.activeDropdown);
        }

        if (isOpen) {
            this.close(dropdown);
        } else {
            this.open(dropdown);
        }
    },

    /**
     * Open dropdown
     */
    open(dropdown) {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const menu = dropdown.querySelector('.custom-dropdown-menu');

        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
        
        this.activeDropdown = dropdown;

        // Focus first option or selected option
        const selectedOption = menu.querySelector('[aria-selected="true"]');
        const firstOption = menu.querySelector('.custom-dropdown-option');
        const optionToFocus = selectedOption || firstOption;
        
        if (optionToFocus) {
            this.setFocusedOption(menu, optionToFocus);
        }
    },

    /**
     * Close dropdown
     */
    close(dropdown) {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const menu = dropdown.querySelector('.custom-dropdown-menu');

        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        
        // Remove focus from options
        menu.querySelectorAll('.custom-dropdown-option').forEach(option => {
            option.classList.remove('focused');
        });

        if (this.activeDropdown === dropdown) {
            this.activeDropdown = null;
        }
    },

    /**
     * Select an option
     */
    selectOption(dropdown, selectElement, value) {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const text = dropdown.querySelector('.custom-dropdown-text');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const options = dropdown.querySelectorAll('.custom-dropdown-option');

        // Update visual selection
        options.forEach(option => {
            const isSelected = option.dataset.value === value;
            option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });

        // Update trigger text
        const selectedOption = Array.from(options).find(opt => opt.dataset.value === value);
        if (selectedOption) {
            text.textContent = selectedOption.textContent;
        }

        // Update original select element
        selectElement.value = value;
        
        // Trigger change event on original select
        const changeEvent = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(changeEvent);

        this.close(dropdown);
        trigger.focus();
    },

    /**
     * Handle keyboard navigation
     */
    handleKeydown(e, dropdown, selectElement) {
        const isOpen = dropdown.classList.contains('open');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const options = Array.from(dropdown.querySelectorAll('.custom-dropdown-option'));

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (!isOpen) {
                    this.open(dropdown);
                } else {
                    const focusedOption = menu.querySelector('.custom-dropdown-option.focused');
                    if (focusedOption) {
                        this.selectOption(dropdown, selectElement, focusedOption.dataset.value);
                    }
                }
                break;

            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    this.close(dropdown);
                    dropdown.querySelector('.custom-dropdown-trigger').focus();
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    this.open(dropdown);
                } else {
                    const currentFocused = menu.querySelector('.custom-dropdown-option.focused');
                    const currentIndex = currentFocused ? options.indexOf(currentFocused) : -1;
                    const nextIndex = Math.min(currentIndex + 1, options.length - 1);
                    this.setFocusedOption(menu, options[nextIndex]);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    this.open(dropdown);
                } else {
                    const currentFocused = menu.querySelector('.custom-dropdown-option.focused');
                    const currentIndex = currentFocused ? options.indexOf(currentFocused) : options.length;
                    const prevIndex = Math.max(currentIndex - 1, 0);
                    this.setFocusedOption(menu, options[prevIndex]);
                }
                break;

            case 'Home':
                if (isOpen) {
                    e.preventDefault();
                    this.setFocusedOption(menu, options[0]);
                }
                break;

            case 'End':
                if (isOpen) {
                    e.preventDefault();
                    this.setFocusedOption(menu, options[options.length - 1]);
                }
                break;
        }
    },

    /**
     * Set focused option in menu
     */
    setFocusedOption(menu, option) {
        // Remove previous focus
        menu.querySelectorAll('.custom-dropdown-option').forEach(opt => {
            opt.classList.remove('focused');
        });

        // Set new focus
        if (option) {
            option.classList.add('focused');
            
            // Scroll into view if needed
            option.scrollIntoView({ block: 'nearest' });
        }
    },

    /**
     * Update dropdown to match select element value
     */
    updateFromSelect(dropdown, selectElement) {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const text = dropdown.querySelector('.custom-dropdown-text');
        const options = dropdown.querySelectorAll('.custom-dropdown-option');
        
        const currentValue = selectElement.value;
        
        // Update visual selection
        options.forEach(option => {
            const isSelected = option.dataset.value === currentValue;
            option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
        
        // Update trigger text
        const selectedOption = Array.from(options).find(opt => opt.dataset.value === currentValue);
        if (selectedOption) {
            text.textContent = selectedOption.textContent;
        }
    },

    /**
     * Replace all select elements on page with custom dropdowns
     */
    replaceAll() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            if (!select.closest('.custom-dropdown') && select.style.display !== 'none') {
                this.create(select);
            }
        });
    }
};