/**
 * MediaStore: simple IndexedDB wrapper to keep user-uploaded media offline
 * and provide blob/object URLs for use in the app.
 */
export const MediaStore = {
  db: null,
  ready: false,

  init() {
    if (!('indexedDB' in window)) return;
    const request = indexedDB.open('tabata-media', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        const store = db.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = (e) => {
      this.db = e.target.result;
      this.ready = true;
    };
    request.onerror = () => {
      console.warn('Failed to init IndexedDB MediaStore');
    };
  },

  async putFile(file) {
    await this.waitReady();
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const data = await file.arrayBuffer();
    const tx = this.db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const record = {
      id,
      name: file.name,
      type: file.type,
      createdAt: Date.now(),
      data
    };
    await new Promise((res, rej) => {
      const req = store.put(record);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    return `ms://${id}`; // custom scheme to reference MediaStore assets
  },

  async getFile(id) {
    await this.waitReady();
    const tx = this.db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    return await new Promise((res, rej) => {
      const req = store.get(id);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  },

  async toObjectURL(msUrl) {
    const id = this.parseId(msUrl);
    const rec = await this.getFile(id);
    if (!rec) return '';
    const blob = new Blob([rec.data], { type: rec.type || 'application/octet-stream' });
    return URL.createObjectURL(blob);
  },

  parseId(msUrl) {
    return msUrl.replace('ms://', '');
  },

  async waitReady() {
    if (this.ready) return;
    await new Promise((r) => setTimeout(r, 50));
    return this.waitReady();
  }
};
