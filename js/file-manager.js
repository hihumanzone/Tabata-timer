/**
 * Enhanced file management for local media uploads and File System Access API integration.
 * Maintains backward compatibility with URL-based media while adding local file capabilities.
 */
export const FileManager = {
    supportsFileSystemAccess: false,
    supportsIndexedDB: false,
    dbName: 'TabataMediaDB',
    dbVersion: 1,
    db: null,

    init() {
        this.checkSupport();
        this.initIndexedDB();
    },

    checkSupport() {
        this.supportsFileSystemAccess = 'showOpenFilePicker' in window;
        this.supportsIndexedDB = 'indexedDB' in window;
        
        console.log('File System Access API:', this.supportsFileSystemAccess ? 'Supported' : 'Not supported');
        console.log('IndexedDB:', this.supportsIndexedDB ? 'Supported' : 'Not supported');
    },

    async initIndexedDB() {
        if (!this.supportsIndexedDB) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB: Error opening database');
                reject(request.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB: Database opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for media files
                if (!db.objectStoreNames.contains('media')) {
                    const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
                    mediaStore.createIndex('type', 'type', { unique: false });
                    mediaStore.createIndex('workoutId', 'workoutId', { unique: false });
                }
                
                console.log('IndexedDB: Database upgraded successfully');
            };
        });
    },

    async selectLocalFile(accept = 'image/*,video/*,audio/*') {
        try {
            if (this.supportsFileSystemAccess) {
                return await this.selectFileWithFSA(accept);
            } else {
                return await this.selectFileWithInput(accept);
            }
        } catch (error) {
            console.error('File selection error:', error);
            throw error;
        }
    },

    async selectFileWithFSA(accept) {
        const types = this.getFilePickerTypes(accept);
        
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: types,
                excludeAcceptAllOption: false,
                multiple: false
            });
            
            const file = await fileHandle.getFile();
            return await this.processSelectedFile(file);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('File selection cancelled');
            }
            throw error;
        }
    },

    async selectFileWithInput(accept) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        const result = await this.processSelectedFile(file);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('No file selected'));
                }
            };
            
            input.oncancel = () => {
                reject(new Error('File selection cancelled'));
            };
            
            input.click();
        });
    },

    async processSelectedFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Create unique ID for the file
            const fileId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create object URL for immediate use
            const objectURL = URL.createObjectURL(file);
            
            // Optionally compress and store in IndexedDB for offline use
            let storedId = null;
            if (this.shouldStoreFile(file)) {
                storedId = await this.storeFileInDB(file, fileId);
            }
            
            return {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                url: objectURL,
                storedId: storedId,
                isLocal: true,
                lastModified: file.lastModified
            };
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    },

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3'
        ];
        
        if (file.size > maxSize) {
            throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type not supported: ${file.type}`);
        }
    },

    shouldStoreFile(file) {
        // Store files smaller than 10MB for offline access
        return file.size < 10 * 1024 * 1024 && this.supportsIndexedDB;
    },

    async storeFileInDB(file, fileId, workoutId = null) {
        if (!this.db) return null;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            const mediaData = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                data: arrayBuffer,
                workoutId: workoutId,
                timestamp: Date.now()
            };
            
            const transaction = this.db.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');
            await store.add(mediaData);
            
            console.log(`File stored in IndexedDB: ${file.name}`);
            return fileId;
        } catch (error) {
            console.error('Error storing file in IndexedDB:', error);
            return null;
        }
    },

    async getStoredFile(fileId) {
        if (!this.db) return null;
        
        try {
            const transaction = this.db.transaction(['media'], 'readonly');
            const store = transaction.objectStore('media');
            const request = store.get(fileId);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        const blob = new Blob([result.data], { type: result.type });
                        const url = URL.createObjectURL(blob);
                        resolve({
                            ...result,
                            url: url,
                            isLocal: true
                        });
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error retrieving stored file:', error);
            return null;
        }
    },

    async deleteStoredFile(fileId) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');
            await store.delete(fileId);
            console.log(`File deleted from IndexedDB: ${fileId}`);
        } catch (error) {
            console.error('Error deleting stored file:', error);
        }
    },

    getFilePickerTypes(accept) {
        const types = [];
        
        if (accept.includes('image/')) {
            types.push({
                description: 'Images',
                accept: {
                    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                }
            });
        }
        
        if (accept.includes('video/')) {
            types.push({
                description: 'Videos',
                accept: {
                    'video/*': ['.mp4', '.webm', '.ogg']
                }
            });
        }
        
        if (accept.includes('audio/')) {
            types.push({
                description: 'Audio',
                accept: {
                    'audio/*': ['.mp3', '.wav', '.ogg']
                }
            });
        }
        
        return types;
    },

    // Helper method to create file input for media steps
    createMediaInput(container, currentValue = '', onChange = null) {
        const wrapper = document.createElement('div');
        wrapper.className = 'media-input-wrapper';
        
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.className = 'step-media';
        urlInput.placeholder = 'https://example.com/image.jpg or select local file';
        urlInput.value = currentValue;
        
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'select-file-btn';
        selectButton.innerHTML = '📁 Select File';
        
        selectButton.addEventListener('click', async () => {
            try {
                const fileData = await this.selectLocalFile();
                urlInput.value = fileData.url;
                urlInput.dataset.fileId = fileData.id;
                urlInput.dataset.isLocal = 'true';
                
                if (onChange) {
                    onChange(fileData);
                }
                
                if (window.Notifications) {
                    window.Notifications.success(`File selected: ${fileData.name}`);
                }
            } catch (error) {
                if (error.message !== 'File selection cancelled') {
                    console.error('File selection error:', error);
                    if (window.Notifications) {
                        window.Notifications.error(`Error: ${error.message}`);
                    }
                }
            }
        });
        
        wrapper.appendChild(urlInput);
        wrapper.appendChild(selectButton);
        
        if (container) {
            container.appendChild(wrapper);
        }
        
        return { wrapper, urlInput, selectButton };
    },

    // Check if a media URL is a local file
    isLocalFile(url) {
        return url && (url.startsWith('blob:') || url.startsWith('file:'));
    },

    // Clean up object URLs to prevent memory leaks
    cleanupObjectURL(url) {
        if (this.isLocalFile(url) && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    },

    // Export/import enhancement for including local files
    async exportWorkoutWithMedia(workout) {
        const exportData = { ...workout };
        const mediaFiles = {};
        
        // Collect all media files from the workout
        const mediaUrls = [
            workout.prepareMedia,
            workout.cooldownMedia,
            ...workout.steps.map(step => step.media)
        ].filter(url => url && this.isLocalFile(url));
        
        // Get stored file data for export
        for (const url of mediaUrls) {
            const fileId = this.extractFileIdFromUrl(url);
            if (fileId) {
                const fileData = await this.getStoredFile(fileId);
                if (fileData) {
                    mediaFiles[fileId] = {
                        name: fileData.name,
                        type: fileData.type,
                        data: Array.from(new Uint8Array(fileData.data))
                    };
                }
            }
        }
        
        return {
            workout: exportData,
            mediaFiles: mediaFiles
        };
    },

    extractFileIdFromUrl(url) {
        // Extract file ID from blob URL or stored reference
        // This is a simplified implementation
        return url.includes('media_') ? url.split('media_')[1]?.split('_')[0] : null;
    }
};