import { SavedVideo } from '../types';

const DB_NAME = 'PadelCoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error al abrir la base de datos:', event);
            reject(false);
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('date', 'date', { unique: false });
            }
        };
    });
};

export const saveVideo = (videoData: Omit<SavedVideo, 'id'>): Promise<number> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('La base de datos no está inicializada.');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(videoData);

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result as number);
        };

        request.onerror = (event) => {
            console.error('Error al guardar el video:', event);
            reject('Error al guardar el video.');
        };
    });
};

export const getVideos = (): Promise<SavedVideo[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('La base de datos no está inicializada.');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result);
        };

        request.onerror = (event) => {
            console.error('Error al obtener los videos:', event);
            reject('Error al obtener los videos.');
        };
    });
};

export const deleteVideo = (id: number): Promise<void> => {
     return new Promise((resolve, reject) => {
        if (!db) {
            reject('La base de datos no está inicializada.');
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error al eliminar el video:', event);
            reject('Error al eliminar el video.');
        };
    });
};
