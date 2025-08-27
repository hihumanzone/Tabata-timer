/**
 * Manages dynamic viewport height for cross-browser compatibility.
 * Addresses Chrome Android viewport height issues, including zoom-related problems.
 */
export const ViewportManager = {
    init() {
        this.isChrome = this.detectChrome();
        this.applyBrowserClasses();
        this.setDynamicViewportHeight();
        this.setupViewportListeners();
    },

    detectChrome() {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    },

    applyBrowserClasses() {
        const body = document.body;
        
        if (this.isChrome) {
            body.classList.add('is-chrome');
        }
        
        this.updateOrientationClass();
    },

    updateOrientationClass() {
        const body = document.body;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        body.classList.toggle('is-landscape', isLandscape);
        body.classList.toggle('is-portrait', !isLandscape);
    },

    getZoomLevel() {
        return Math.round((window.devicePixelRatio || 1) * 100) / 100;
    },

    setDynamicViewportHeight() {
        if (this.isChrome) {
            if (CSS.supports('height', '100svh')) {
                document.documentElement.style.setProperty('--vh-small', '100svh');
                document.documentElement.style.setProperty('--vh-dynamic', '100svh');
            } else if (CSS.supports('height', '100lvh')) {
                document.documentElement.style.setProperty('--vh-large', '100lvh');
                document.documentElement.style.setProperty('--vh-dynamic', '100lvh');
            } else {
                this.setChromeCompatibleHeight();
            }
            
            if (CSS.supports('height', '100lvh')) {
                document.documentElement.style.setProperty('--vh-large', '100lvh');
            }
        } else {
            this.setJavaScriptHeight();
            
            if (CSS.supports('height', '100svh')) {
                document.documentElement.style.setProperty('--vh-small', '100svh');
            }
            if (CSS.supports('height', '100lvh')) {
                document.documentElement.style.setProperty('--vh-large', '100lvh');
            }
        }
        
        this.updateOrientationClass();
    },

    setChromeCompatibleHeight() {
        const clientHeight = document.documentElement.clientHeight;
        const innerHeight = window.innerHeight;
        
        const safeHeight = Math.min(clientHeight, innerHeight);
        const vh = safeHeight * 0.01;
        
        document.documentElement.style.setProperty('--vh-dynamic', `${vh * 100}px`);
    },

    setJavaScriptHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh-dynamic', `${vh * 100}px`);
    },

    setupViewportListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setDynamicViewportHeight();
            }, 150);
        });

        if ('orientation' in screen) {
            screen.orientation.addEventListener('change', () => {
                setTimeout(() => {
                    this.setDynamicViewportHeight();
                }, 300);
            });
        } else {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.setDynamicViewportHeight();
                }, 300);
            });
        }

        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', () => {
                this.setDynamicViewportHeight();
            });
        }

        if (this.isChrome) {
            let lastZoom = this.getZoomLevel();
            setInterval(() => {
                const currentZoom = this.getZoomLevel();
                if (Math.abs(currentZoom - lastZoom) > 0.1) {
                    lastZoom = currentZoom;
                    setTimeout(() => {
                        this.setDynamicViewportHeight();
                    }, 100);
                }
            }, 500);
        }
    },

    logViewportInfo() {
        const info = {
            browser: this.isChrome ? 'Chrome' : 'Other',
            windowInnerHeight: window.innerHeight,
            documentClientHeight: document.documentElement.clientHeight,
            zoomLevel: this.getZoomLevel(),
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
            vhDynamic: getComputedStyle(document.documentElement).getPropertyValue('--vh-dynamic'),
            supports100svh: CSS.supports('height', '100svh'),
            supports100lvh: CSS.supports('height', '100lvh'),
            visualViewportHeight: window.visualViewport ? window.visualViewport.height : 'N/A',
            safeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top, 0px)') || '0px',
            safeAreaBottom: getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom, 0px)') || '0px'
        };
        console.log('ViewportManager Debug Info:', info);
        return info;
    }
};