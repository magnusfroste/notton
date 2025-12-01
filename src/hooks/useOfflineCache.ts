import { useState, useEffect, useCallback } from "react";
import type { Note, Folder } from "./useNotes";

const DB_NAME = "notton-offline";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const FOLDERS_STORE = "folders";
const PENDING_STORE = "pending_sync";

interface PendingSync {
  id: string;
  type: "note" | "folder";
  action: "create" | "update" | "delete";
  data: Partial<Note | Folder>;
  timestamp: number;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(NOTES_STORE)) {
        database.createObjectStore(NOTES_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(FOLDERS_STORE)) {
        database.createObjectStore(FOLDERS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(PENDING_STORE)) {
        database.createObjectStore(PENDING_STORE, { keyPath: "id" });
      }
    };
  });
};

export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const cacheNotes = useCallback(async (notes: Note[]) => {
    try {
      const database = await openDB();
      const tx = database.transaction(NOTES_STORE, "readwrite");
      const store = tx.objectStore(NOTES_STORE);

      // Clear existing and add new
      store.clear();
      notes.forEach((note) => store.put(note));

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to cache notes:", error);
    }
  }, []);

  const cacheFolders = useCallback(async (folders: Folder[]) => {
    try {
      const database = await openDB();
      const tx = database.transaction(FOLDERS_STORE, "readwrite");
      const store = tx.objectStore(FOLDERS_STORE);

      store.clear();
      folders.forEach((folder) => store.put(folder));

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to cache folders:", error);
    }
  }, []);

  const getCachedNotes = useCallback(async (): Promise<Note[]> => {
    try {
      const database = await openDB();
      const tx = database.transaction(NOTES_STORE, "readonly");
      const store = tx.objectStore(NOTES_STORE);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get cached notes:", error);
      return [];
    }
  }, []);

  const getCachedFolders = useCallback(async (): Promise<Folder[]> => {
    try {
      const database = await openDB();
      const tx = database.transaction(FOLDERS_STORE, "readonly");
      const store = tx.objectStore(FOLDERS_STORE);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get cached folders:", error);
      return [];
    }
  }, []);

  const updateCachedNote = useCallback(async (note: Note) => {
    try {
      const database = await openDB();
      const tx = database.transaction(NOTES_STORE, "readwrite");
      const store = tx.objectStore(NOTES_STORE);
      store.put(note);

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to update cached note:", error);
    }
  }, []);

  const deleteCachedNote = useCallback(async (id: string) => {
    try {
      const database = await openDB();
      const tx = database.transaction(NOTES_STORE, "readwrite");
      const store = tx.objectStore(NOTES_STORE);
      store.delete(id);

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to delete cached note:", error);
    }
  }, []);

  const addPendingSync = useCallback(async (item: PendingSync) => {
    try {
      const database = await openDB();
      const tx = database.transaction(PENDING_STORE, "readwrite");
      const store = tx.objectStore(PENDING_STORE);
      store.put(item);
      setHasPendingSync(true);

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to add pending sync:", error);
    }
  }, []);

  const getPendingSyncs = useCallback(async (): Promise<PendingSync[]> => {
    try {
      const database = await openDB();
      const tx = database.transaction(PENDING_STORE, "readonly");
      const store = tx.objectStore(PENDING_STORE);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get pending syncs:", error);
      return [];
    }
  }, []);

  const clearPendingSync = useCallback(async (id: string) => {
    try {
      const database = await openDB();
      const tx = database.transaction(PENDING_STORE, "readwrite");
      const store = tx.objectStore(PENDING_STORE);
      store.delete(id);

      const remaining = await getPendingSyncs();
      setHasPendingSync(remaining.length > 0);

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to clear pending sync:", error);
    }
  }, [getPendingSyncs]);

  const clearAllPendingSyncs = useCallback(async () => {
    try {
      const database = await openDB();
      const tx = database.transaction(PENDING_STORE, "readwrite");
      const store = tx.objectStore(PENDING_STORE);
      store.clear();
      setHasPendingSync(false);

      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Failed to clear pending syncs:", error);
    }
  }, []);

  // Check for pending syncs on mount
  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingSyncs();
      setHasPendingSync(pending.length > 0);
    };
    checkPending();
  }, [getPendingSyncs]);

  return {
    isOnline,
    hasPendingSync,
    cacheNotes,
    cacheFolders,
    getCachedNotes,
    getCachedFolders,
    updateCachedNote,
    deleteCachedNote,
    addPendingSync,
    getPendingSyncs,
    clearPendingSync,
    clearAllPendingSyncs,
  };
}
