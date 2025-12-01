import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch notes");
      console.error(error);
    } else {
      setNotes(data || []);
    }
  }, [user]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to fetch folders");
      console.error(error);
    } else {
      setFolders(data || []);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotes(), fetchFolders()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchNotes, fetchFolders]);

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

  // Optimistic update with rollback
  const updateNote = async (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id" | "is_deleted" | "deleted_at">>) => {
    // Capture previous state for rollback
    const previousNotes = notes;
    const optimisticUpdate = { ...updates, updated_at: new Date().toISOString() };
    
    // Optimistically update local state
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...optimisticUpdate } : note))
    );

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

  // Optimistic delete with rollback
  const deleteNote = async (id: string, permanent = false) => {
    const previousNotes = notes;
    
    if (permanent) {
      // Optimistically remove from list
      setNotes((prev) => prev.filter((note) => note.id !== id));

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
    createNote,
    importNote,
    updateNote,
    deleteNote,
    restoreNote,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: useCallback(() => Promise.all([fetchNotes(), fetchFolders()]), [fetchNotes, fetchFolders]),
  };
}
