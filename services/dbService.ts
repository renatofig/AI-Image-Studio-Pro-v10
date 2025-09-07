import { AppState, GalleryImage } from '../types';

const DB_NAME = 'AIImageStudioDB';
const DB_VERSION = 2; // Incremented version to add new store
const GALLERY_STORE_NAME = 'gallery';
const SESSION_STORE_NAME = 'sessionData';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(GALLERY_STORE_NAME)) {
        const store = dbInstance.createObjectStore(GALLERY_STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
       if (!dbInstance.objectStoreNames.contains(SESSION_STORE_NAME)) {
        dbInstance.createObjectStore(SESSION_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Helper to make state storable by removing non-cloneable File objects
const makeStateStorable = (state: AppState): AppState => {
    const storableState = { ...state };
    if (storableState.image1) storableState.image1 = { ...storableState.image1, file: null as any };
    if (storableState.originalImage1) storableState.originalImage1 = { ...storableState.originalImage1, file: null as any };
    if (storableState.image2) storableState.image2 = { ...storableState.image2, file: null as any };
    if (storableState.customWatermark) storableState.customWatermark = { ...storableState.customWatermark, file: null as any };
    return storableState;
}


export const dbService = {
  async addImage(image: GalleryImage): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    store.put(image);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async getImages(): Promise<GalleryImage[]> {
    const db = await openDB();
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as GalleryImage[]);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteImage(id: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    store.delete(id);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  
  async clearImages(): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async updateImage(image: GalleryImage): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(GALLERY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(GALLERY_STORE_NAME);
    store.put(image);
     return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // Session methods
  async saveSessionState(state: AppState): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(SESSION_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE_NAME);
    store.put({ id: 'currentSession', state: makeStateStorable(state) });
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async loadSessionState(): Promise<AppState | null> {
    const db = await openDB();
    const transaction = db.transaction(SESSION_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SESSION_STORE_NAME);
    const request = store.get('currentSession');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ? (request.result.state as AppState) : null);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  async clearSessionState(): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(SESSION_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE_NAME);
    store.delete('currentSession');
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
};