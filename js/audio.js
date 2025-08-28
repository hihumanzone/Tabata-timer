/**
 * Audio system using Web Audio API for timer sound cues
 */
export const Audio = {
    audioContext: null,
    enabled: true,

    /**
     * Initialize the audio context
     */
    init() {
        try {
            // Create audio context with proper browser compatibility
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            } else {
                console.warn('Web Audio API not supported');
                this.enabled = false;
            }
        } catch (error) {
            console.warn('Failed to initialize audio context:', error);
            this.enabled = false;
        }
    },

    /**
     * Resume audio context if it's suspended (required by browser autoplay policies)
     */
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Failed to resume audio context:', error);
            }
        }
    },

    /**
     * Create a beep sound for countdown (3, 2, 1)
     * Higher pitched, shorter beep
     */
    playCountdownBeep() {
        this.playBeep(800, 0.3, 0.1); // 800Hz, 300ms duration, 0.1 volume
    },

    /**
     * Create a start sound for new task/exercise
     * Lower pitched, longer sound
     */
    playTaskStartSound() {
        this.playBeep(400, 0.5, 0.15); // 400Hz, 500ms duration, 0.15 volume
    },

    /**
     * Generate and play a beep sound
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume (0-1)
     */
    playBeep(frequency = 800, duration = 0.3, volume = 0.1) {
        if (!this.enabled || !this.audioContext) {
            return;
        }

        try {
            // Resume context if needed
            this.resumeContext();

            const currentTime = this.audioContext.currentTime;
            
            // Create oscillator for the beep
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, currentTime);

            // Configure gain envelope for smooth beep
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration); // Smooth decay

            // Start and stop oscillator
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);

        } catch (error) {
            console.warn('Failed to play beep:', error);
        }
    },

    /**
     * Enable/disable audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    },

    /**
     * Check if audio is available and enabled
     */
    isEnabled() {
        return this.enabled && this.audioContext !== null;
    }
};