import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSidebar } from "@/components/notes/FolderSidebar";
import { NotesList } from "@/components/notes/NotesList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIChatPanel } from "@/components/notes/AIChatPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes, Note } from "@/hooks/useNotes";
import { toast } from "sonner";

export type { Note } from "@/hooks/useNotes";

export interface Folder {
  id: string;
  name: string;
  icon: string;
  count: number;
  isSystem?: boolean;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { notes, folders: userFolders, loading: notesLoading, createNote, importNote, updateNote, deleteNote, restoreNote, createFolder, deleteFolder } = useNotes();
  
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N for new note
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFolder]);

  // Build folder list with counts
  const folders = useMemo(() => {
    const activeNotes = notes.filter((n) => !n.is_deleted);
    const deletedNotes = notes.filter((n) => n.is_deleted);

    const systemFolders: Folder[] = [
      { id: "all", name: "All Notes", icon: "FileText", count: activeNotes.length, isSystem: true },
      { id: "trash", name: "Recently Deleted", icon: "Trash2", count: deletedNotes.length, isSystem: true },
    ];

    const userFoldersMapped: Folder[] = userFolders.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
      count: activeNotes.filter((n) => n.folder_id === f.id).length,
    }));

    return [...systemFolders, ...userFoldersMapped];
  }, [notes, userFolders]);

  // Filter notes based on selected folder and search
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by folder
    if (selectedFolder === "all") {
      filtered = filtered.filter((n) => !n.is_deleted);
    } else if (selectedFolder === "trash") {
      filtered = filtered.filter((n) => n.is_deleted);
    } else {
      filtered = filtered.filter((n) => n.folder_id === selectedFolder && !n.is_deleted);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notes, selectedFolder, searchQuery]);

  // Auto-select first note when filtered list changes
  useEffect(() => {
    if (filteredNotes.length > 0 && !filteredNotes.find((n) => n.id === selectedNote?.id)) {
      setSelectedNote(filteredNotes[0]);
    } else if (filteredNotes.length === 0) {
      setSelectedNote(null);
    }
  }, [filteredNotes]);

  const handleCreateNote = async () => {
    const folderId = selectedFolder !== "all" && selectedFolder !== "trash" ? selectedFolder : null;
    const newNote = await createNote(folderId);
    if (newNote) {
      setSelectedNote(newNote);
    }
  };

  const handleImportNote = async (title: string, content: string) => {
    const folderId = selectedFolder !== "all" && selectedFolder !== "trash" ? selectedFolder : null;
    const newNote = await importNote(title, content, folderId);
    if (newNote) {
      setSelectedNote(newNote);
    }
    return newNote;
  };

  const handleUpdateNote = async (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id">>) => {
    await updateNote(id, updates);
    if (selectedNote?.id === id) {
      setSelectedNote((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    
    if (selectedNote.is_deleted) {
      await deleteNote(selectedNote.id, true);
    } else {
      await deleteNote(selectedNote.id);
    }
  };

  const handleDeleteNoteFromList = async (note: Note) => {
    if (note.is_deleted) {
      await deleteNote(note.id, true);
    } else {
      await deleteNote(note.id);
    }
  };

  const handleDuplicateNote = async (note: Note) => {
    const folderId = note.folder_id;
    const newNote = await importNote(`${note.title} (copy)`, note.content, folderId);
    if (newNote) {
      setSelectedNote(newNote);
      toast.success("Note duplicated");
    }
  };

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    await updateNote(noteId, { folder_id: folderId });
    const folderName = folderId 
      ? userFolders.find(f => f.id === folderId)?.name || "folder"
      : "All Notes";
    toast.success(`Note moved to ${folderName}`);
  };

  const handleRestoreNote = async () => {
    if (!selectedNote) return;
    await restoreNote(selectedNote.id);
  };

  const handleApplyAIContent = (content: string) => {
    if (selectedNote) {
      handleUpdateNote(selectedNote.id, { content });
    }
  };

  if (authLoading || notesLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Sidebar - Folders */}
      <FolderSidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
        onSignOut={signOut}
      />

      {/* Center Column - Notes List */}
      <NotesList
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNote={handleCreateNote}
        onImportNote={handleImportNote}
        onDuplicateNote={handleDuplicateNote}
        onDeleteNote={handleDeleteNoteFromList}
        onMoveNote={handleMoveNote}
        folders={userFolders}
        isTrashView={selectedFolder === "trash"}
      />

      {/* Right Column - Note Editor */}
      <NoteEditor
        note={selectedNote}
        folders={userFolders}
        onOpenAIPanel={() => setIsAIPanelOpen(true)}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onRestoreNote={handleRestoreNote}
        isTrashView={selectedFolder === "trash"}
      />

      {/* AI Chat Panel - Slide-out */}
      <AIChatPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        note={selectedNote}
        onApplyContent={handleApplyAIContent}
      />
    </div>
  );
};

export default Dashboard;
