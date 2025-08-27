/**
 * Custom notification system for toast-style alerts
 * Replaces native browser alert() functions with non-blocking notifications
 */
export const Notifications = {
    container: null,
    queue: [],
    
    /**
     * Initialize notification container
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show a notification
     * @param {Object} options - Notification configuration
     * @param {string} options.message - Notification message
     * @param {string} options.type - Notification type: 'success', 'error', 'info', 'warning'
     * @param {number} options.duration - Auto-dismiss duration in ms (default: 4000, 0 = no auto-dismiss)
     * @param {boolean} options.closable - Show close button (default: true)
     */
    show(options = {}) {
        this.init();

        const {
            message = '',
            type = 'info',
            duration = 4000,
            closable = true
        } = options;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getIcon(type)}
                </div>
                <div class="notification-message">${message}</div>
                ${closable ? '<button class="notification-close" aria-label="Close notification">&times;</button>' : ''}
            </div>
        `;

        // Add to container
        this.container.appendChild(notification);

        // Handle close button
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.hide(notification));
        }

        // Show with animation
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    },

    /**
     * Hide and remove notification
     */
    hide(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('visible');
        notification.classList.add('hiding');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },

    /**
     * Convenience methods for different notification types
     */
    success(message, duration = 4000) {
        return this.show({ message, type: 'success', duration });
    },

    error(message, duration = 6000) {
        return this.show({ message, type: 'error', duration });
    },

    warning(message, duration = 5000) {
        return this.show({ message, type: 'warning', duration });
    },

    info(message, duration = 4000) {
        return this.show({ message, type: 'info', duration });
    },

    /**
     * Clear all notifications
     */
    clear() {
        if (this.container) {
            const notifications = this.container.querySelectorAll('.notification');
            notifications.forEach(notification => this.hide(notification));
        }
    }
};