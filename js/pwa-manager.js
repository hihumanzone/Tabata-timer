/**
 * Manages PWA installation, offline detection, and service worker communication.
 */
export const PWAManager = {
    deferredPrompt: null,
    isInstalled: false,
    isOnline: navigator.onLine,
    installButton: null,
    offlineIndicator: null,

    init() {
        this.checkInstallationStatus();
        this.setupOfflineDetection();
        this.registerServiceWorker();
        this.createInstallButton();
        this.createOfflineIndicator();
        this.setupBeforeInstallPrompt();
    },

    checkInstallationStatus() {
        // Check if app is installed (standalone mode)
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
        
        console.log('PWA Installation Status:', this.isInstalled ? 'Installed' : 'Not Installed');
    },

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });

                // Handle service worker messages
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    },

    setupBeforeInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA: App was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccessNotification();
        });
    },

    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            this.showInstallInstructions();
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('PWA: Install prompt outcome:', outcome);
            
            if (outcome === 'accepted') {
                console.log('PWA: User accepted install prompt');
            } else {
                console.log('PWA: User dismissed install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        } catch (error) {
            console.error('PWA: Error showing install prompt:', error);
        }
    },

    createInstallButton() {
        if (this.isInstalled) return;

        const installButton = document.createElement('button');
        installButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Install App
        `;
        installButton.className = 'install-button hidden';
        installButton.id = 'pwaInstallBtn';
        installButton.addEventListener('click', () => this.showInstallPrompt());
        
        // Add to settings area if it exists
        const settingsArea = document.querySelector('.home-header .actions');
        if (settingsArea) {
            settingsArea.insertBefore(installButton, settingsArea.firstChild);
        }
        
        this.installButton = installButton;
    },

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.classList.remove('hidden');
        }
    },

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.add('hidden');
        }
    },

    createOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.76.59 6.82.36 7l11.63 14.49.01.01.01-.01L16.67 16l1.96 1.96 1.27-1.27-2.86-2.47z"/>
            </svg>
            <span>Offline</span>
        `;
        indicator.className = 'offline-indicator hidden';
        indicator.id = 'offlineIndicator';
        
        document.body.appendChild(indicator);
        this.offlineIndicator = indicator;
    },

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            console.log('PWA: Back online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
            console.log('PWA: Gone offline');
        });

        // Initial state
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
    },

    showOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.classList.remove('hidden');
        }
    },

    hideOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.classList.add('hidden');
        }
    },

    showInstallInstructions() {
        const instructions = this.getInstallInstructions();
        if (window.Notifications) {
            window.Notifications.info(instructions);
        } else {
            alert(instructions);
        }
    },

    getInstallInstructions() {
        const userAgent = navigator.userAgent;
        
        if (/iPhone|iPad/.test(userAgent)) {
            return 'To install: Tap the Share button and select "Add to Home Screen"';
        } else if (/Android/.test(userAgent)) {
            return 'To install: Tap the menu (⋮) and select "Add to Home screen" or "Install app"';
        } else if (/Chrome/.test(userAgent)) {
            return 'To install: Click the install icon in the address bar or use browser menu';
        }
        
        return 'To install: Use your browser\'s "Add to Home Screen" or "Install" option';
    },

    showInstallSuccessNotification() {
        if (window.Notifications) {
            window.Notifications.success('App installed successfully! You can now use it offline.');
        }
    },

    showUpdateNotification() {
        if (window.Notifications) {
            window.Notifications.info('A new version is available. Refresh to update.');
        }
    },

    handleServiceWorkerMessage(event) {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('PWA: Cache updated');
        }
    },

    // Utility methods for other modules
    async getCacheSize() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.cacheSize || 0);
                };
                navigator.serviceWorker.controller.postMessage(
                    { type: 'GET_CACHE_SIZE' },
                    [messageChannel.port2]
                );
            });
        }
        return 0;
    },

    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('PWA: Cache cleared');
        }
    },

    // Check if we're running as a PWA
    isPWA() {
        return this.isInstalled;
    },

    // Check if we have network connectivity
    isNetworkAvailable() {
        return this.isOnline;
    }
};