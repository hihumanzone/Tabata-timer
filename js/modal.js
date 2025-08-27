/**
 * Custom modal system for confirmations and dialogs
 * Replaces native browser confirm() and alert() functions
 */
export const Modal = {
    // Store active modal for focus management
    activeModal: null,
    previousFocus: null,

    /**
     * Show a confirmation modal with custom title, message and buttons
     * @param {Object} options - Modal configuration
     * @param {string} options.title - Modal title
     * @param {string} options.message - Modal message
     * @param {string} options.confirmText - Confirm button text (default: 'OK')
     * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
     * @param {string} options.type - Modal type: 'confirm' or 'alert' (default: 'confirm')
     * @returns {Promise<boolean>} - true if confirmed, false if canceled
     */
    show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = '',
                confirmText = 'OK',
                cancelText = 'Cancel',
                type = 'confirm'
            } = options;

            // Create modal HTML
            const modalHTML = `
                <div class="custom-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="custom-modal-title">
                    <div class="custom-modal-content">
                        <div class="custom-modal-header">
                            <h2 id="custom-modal-title">${title}</h2>
                        </div>
                        <div class="custom-modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="custom-modal-actions">
                            ${type === 'confirm' ? `<button class="custom-modal-cancel secondary">${cancelText}</button>` : ''}
                            <button class="custom-modal-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            // Create modal element
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalHTML;
            const modal = modalElement.firstElementChild;
            
            // Store current focus for restoration
            this.previousFocus = document.activeElement;
            this.activeModal = modal;

            // Add to DOM
            document.body.appendChild(modal);

            // Focus management
            const confirmBtn = modal.querySelector('.custom-modal-confirm');
            const cancelBtn = modal.querySelector('.custom-modal-cancel');
            
            // Set up focus trap
            this.setupFocusTrap(modal);
            
            // Focus confirm button by default
            setTimeout(() => confirmBtn.focus(), 100);

            // Event handlers
            const handleConfirm = () => {
                this.hide(modal);
                resolve(true);
            };

            const handleCancel = () => {
                this.hide(modal);
                resolve(false);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            // Attach event listeners
            confirmBtn.addEventListener('click', handleConfirm);
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            modal.addEventListener('keydown', handleKeydown);

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            });

            // Show modal with animation
            requestAnimationFrame(() => {
                modal.classList.add('visible');
            });
        });
    },

    /**
     * Hide and remove modal from DOM
     */
    hide(modal) {
        if (!modal) return;

        modal.classList.remove('visible');
        
        // Remove after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
                this.previousFocus = null;
            }
            
            this.activeModal = null;
        }, 200);
    },

    /**
     * Set up focus trap within modal
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    },

    /**
     * Convenience method for simple confirmation
     */
    confirm(message, title = 'Confirm') {
        return this.show({
            title,
            message,
            type: 'confirm'
        });
    },

    /**
     * Convenience method for simple alert
     */
    alert(message, title = 'Information') {
        return this.show({
            title,
            message,
            type: 'alert',
            confirmText: 'OK'
        });
    },

    /**
     * Show a workout completion modal with celebration styling
     * @param {Object} options - Modal configuration
     * @param {string} options.title - Modal title (default: 'Workout Complete!')
     * @param {string} options.message - Modal message (default: 'Great job!')
     * @param {string} options.confirmText - Confirm button text (default: 'Awesome!')
     * @returns {Promise<boolean>} - true when confirmed
     */
    showWorkoutComplete(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Workout Complete!',
                message = 'Great job! You\'ve successfully completed your workout.',
                confirmText = 'Awesome!'
            } = options;

            // Create celebration modal HTML with larger styling
            const modalHTML = `
                <div class="custom-modal-overlay workout-complete-modal" role="dialog" aria-modal="true" aria-labelledby="workout-complete-title">
                    <div class="custom-modal-content workout-complete-content">
                        <div class="workout-complete-celebration">
                            <div class="celebration-icon">🎉</div>
                        </div>
                        <div class="custom-modal-header">
                            <h2 id="workout-complete-title">${title}</h2>
                        </div>
                        <div class="custom-modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="custom-modal-actions">
                            <button class="custom-modal-confirm primary">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            // Create modal element
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalHTML;
            const modal = modalElement.firstElementChild;

            // Store for focus management
            this.previousFocus = document.activeElement;
            this.activeModal = modal;

            // Add to DOM
            document.body.appendChild(modal);

            // Set up event listeners
            const confirmBtn = modal.querySelector('.custom-modal-confirm');

            const handleConfirm = () => {
                this.hide(modal);
                resolve(true);
            };

            confirmBtn.addEventListener('click', handleConfirm);

            // Handle keyboard navigation
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                }
            });

            // Set up focus trap
            this.setupFocusTrap(modal);

            // Focus the confirm button
            setTimeout(() => {
                confirmBtn.focus();
            }, 100);

            // Add show animation
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
        });
    }
};