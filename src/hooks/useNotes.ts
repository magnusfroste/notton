import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useOfflineCache } from "./useOfflineCache";

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const initialLoadDone = useRef(false);

  const {
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
  } = useOfflineCache();

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    // If offline, use cached data
    if (!navigator.onLine) {
      const cached = await getCachedNotes();
      if (cached.length > 0) {
        setNotes(cached.filter((n) => n.user_id === user.id).sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));
      }
      return;
    }
    
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      // On error, try cache
      const cached = await getCachedNotes();
      if (cached.length > 0) {
        setNotes(cached.filter((n) => n.user_id === user.id));
        toast.error("Using cached data - couldn't reach server");
      } else {
        toast.error("Failed to fetch notes");
      }
      console.error(error);
    } else {
      setNotes(data || []);
      // Cache the fetched data
      if (data) {
        await cacheNotes(data);
      }
    }
  }, [user, getCachedNotes, cacheNotes]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;

    // If offline, use cached data
    if (!navigator.onLine) {
      const cached = await getCachedFolders();
      if (cached.length > 0) {
        setFolders(cached.filter((f) => f.user_id === user.id).sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
      return;
    }
    
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      const cached = await getCachedFolders();
      if (cached.length > 0) {
        setFolders(cached.filter((f) => f.user_id === user.id));
        toast.error("Using cached data - couldn't reach server");
      } else {
        toast.error("Failed to fetch folders");
      }
      console.error(error);
    } else {
      setFolders(data || []);
      if (data) {
        await cacheFolders(data);
      }
    }
  }, [user, getCachedFolders, cacheFolders]);

  // Sync pending changes when back online
  const syncPendingChanges = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    const pending = await getPendingSyncs();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;

    for (const item of pending) {
      try {
        if (item.type === "note") {
          if (item.action === "update") {
            const { error } = await supabase
              .from("notes")
              .update(item.data)
              .eq("id", item.id);
            if (!error) {
              await clearPendingSync(item.id);
              syncedCount++;
            }
          } else if (item.action === "delete") {
            const { error } = await supabase
              .from("notes")
              .delete()
              .eq("id", item.id);
            if (!error) {
              await clearPendingSync(item.id);
              syncedCount++;
            }
          }
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    }

    setIsSyncing(false);

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} change${syncedCount > 1 ? "s" : ""}`);
      await fetchNotes();
    }
  }, [user, getPendingSyncs, clearPendingSync, fetchNotes]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Load cached data first for instant UI
      if (!initialLoadDone.current) {
        const [cachedNotes, cachedFolders] = await Promise.all([
          getCachedNotes(),
          getCachedFolders(),
        ]);
        
        if (cachedNotes.length > 0 && user) {
          setNotes(cachedNotes.filter((n) => n.user_id === user.id));
        }
        if (cachedFolders.length > 0 && user) {
          setFolders(cachedFolders.filter((f) => f.user_id === user.id));
        }
        initialLoadDone.current = true;
      }

      // Then fetch fresh data
      await Promise.all([fetchNotes(), fetchFolders()]);
      setLoading(false);

      // Sync pending changes if online
      if (navigator.onLine) {
        await syncPendingChanges();
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchNotes, fetchFolders, getCachedNotes, getCachedFolders, syncPendingChanges]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && hasPendingSync) {
      syncPendingChanges();
    }
  }, [isOnline, hasPendingSync, syncPendingChanges]);

  const createNote = async (folderId?: string | null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        title: "Untitled",
        content: "",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create note");
      console.error(error);
      return null;
    }

    setNotes((prev) => [data, ...prev]);
    return data;
  };

  const importNote = async (title: string, content: string, folderId?: string | null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    setNotes((prev) => [data, ...prev]);
    return data;
  };

  // Optimistic update with rollback and offline support
  const updateNote = async (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id" | "is_deleted" | "deleted_at">>) => {
    // Capture previous state for rollback
    const previousNotes = notes;
    const optimisticUpdate = { ...updates, updated_at: new Date().toISOString() };
    
    // Optimistically update local state
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...optimisticUpdate } : note))
    );

    // Update local cache
    const updatedNote = notes.find((n) => n.id === id);
    if (updatedNote) {
      await updateCachedNote({ ...updatedNote, ...optimisticUpdate });
    }

    // If offline, queue for sync
    if (!navigator.onLine) {
      await addPendingSync({
        id,
        type: "note",
        action: "update",
        data: updates,
        timestamp: Date.now(),
      });
      return true;
    }

    // Make API call
    const { error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", id);

    if (error) {
      // Rollback on failure
      setNotes(previousNotes);
      toast.error("Failed to update note");
      console.error(error);
      return false;
    }

    return true;
  };

  // Optimistic delete with rollback and offline support
  const deleteNote = async (id: string, permanent = false) => {
    const previousNotes = notes;
    
    if (permanent) {
      // Optimistically remove from list
      setNotes((prev) => prev.filter((note) => note.id !== id));
      
      // Update cache
      await deleteCachedNote(id);

      // If offline, queue for sync
      if (!navigator.onLine) {
        await addPendingSync({
          id,
          type: "note",
          action: "delete",
          data: {},
          timestamp: Date.now(),
        });
        return true;
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id);

      if (error) {
        // Rollback on failure
        setNotes(previousNotes);
        toast.error("Failed to delete note");
        console.error(error);
        return false;
      }
    } else {
      // Soft delete - use optimistic updateNote
      return updateNote(id, { is_deleted: true, deleted_at: new Date().toISOString() });
    }
    return true;
  };

  // Optimistic restore with rollback
  const restoreNote = async (id: string) => {
    return updateNote(id, { is_deleted: false, deleted_at: null });
  };

  // Optimistic create folder with rollback
  const createFolder = async (name: string, icon = "Folder") => {
    if (!user) return null;

    // Create optimistic folder with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticFolder: Folder = {
      id: tempId,
      user_id: user.id,
      name,
      icon,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistically add folder
    setFolders((prev) => [...prev, optimisticFolder]);

    const { data, error } = await supabase
      .from("folders")
      .insert({
        user_id: user.id,
        name,
        icon,
      })
      .select()
      .single();

    if (error) {
      // Rollback on failure
      setFolders((prev) => prev.filter((f) => f.id !== tempId));
      toast.error("Failed to create folder");
      console.error(error);
      return null;
    }

    // Replace temp folder with real data
    setFolders((prev) => prev.map((f) => (f.id === tempId ? data : f)));
    toast.success("Folder created");
    return data;
  };

  // Optimistic update folder with rollback
  const updateFolder = async (id: string, updates: Partial<Pick<Folder, "name" | "icon">>) => {
    const previousFolders = folders;

    // Optimistically update
    setFolders((prev) =>
      prev.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder))
    );

    const { error } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", id);

    if (error) {
      // Rollback on failure
      setFolders(previousFolders);
      toast.error("Failed to update folder");
      console.error(error);
      return false;
    }

    return true;
  };

  // Optimistic delete folder with rollback
  const deleteFolder = async (id: string) => {
    const previousFolders = folders;

    // Optimistically remove
    setFolders((prev) => prev.filter((folder) => folder.id !== id));

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (error) {
      // Rollback on failure
      setFolders(previousFolders);
      toast.error("Failed to delete folder");
      console.error(error);
      return false;
    }

    toast.success("Folder deleted");
    return true;
  };

  return {
    notes,
    folders,
    loading,
    isOnline,
    hasPendingSync,
    isSyncing,
    createNote,
    importNote,
    updateNote,
    deleteNote,
    restoreNote,
    createFolder,
    updateFolder,
    deleteFolder,
    syncPendingChanges,
    refetch: useCallback(() => Promise.all([fetchNotes(), fetchFolders()]), [fetchNotes, fetchFolders]),
  };
}
