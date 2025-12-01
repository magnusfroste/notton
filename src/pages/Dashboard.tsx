import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSidebar } from "@/components/notes/FolderSidebar";
import { NotesList } from "@/components/notes/NotesList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIChatPanel } from "@/components/notes/AIChatPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes, Note } from "@/hooks/useNotes";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
  const [aiFolderNotes, setAiFolderNotes] = useState<Note[] | null>(null);
  const [aiFolderName, setAiFolderName] = useState<string | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Cmd+N or Ctrl+N for new note
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
        return;
      }

      // Arrow keys for navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredNotes.length === 0) return;
        
        const currentIndex = selectedNote 
          ? filteredNotes.findIndex(n => n.id === selectedNote.id)
          : -1;
        
        let newIndex: number;
        if (e.key === "ArrowDown") {
          newIndex = currentIndex < filteredNotes.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : filteredNotes.length - 1;
        }
        
        setSelectedNote(filteredNotes[newIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredNotes, selectedNote]);

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

  const handleOpenFolderAI = (folderId: string) => {
    const folderNotes = notes.filter(n => n.folder_id === folderId && !n.is_deleted);
    const folder = userFolders.find(f => f.id === folderId);
    setAiFolderNotes(folderNotes);
    setAiFolderName(folder?.name);
    setIsAIPanelOpen(true);
  };

  const handleOpenSingleNoteAI = () => {
    setAiFolderNotes(null);
    setAiFolderName(undefined);
    setIsAIPanelOpen(true);
  };

  const handleOpenAIWithNotes = (selectedNotes: Note[]) => {
    setAiFolderNotes(selectedNotes);
    setAiFolderName(`${selectedNotes.length} selected notes`);
    setIsAIPanelOpen(true);
  };

  const handleCreateNoteFromAI = async (title: string, content: string) => {
    // Create in current folder context or no folder
    const folderId = aiFolderNotes && aiFolderNotes.length > 0 
      ? aiFolderNotes[0].folder_id 
      : (selectedFolder !== "all" && selectedFolder !== "trash" ? selectedFolder : null);
    const newNote = await importNote(title, content, folderId);
    if (newNote) {
      setSelectedNote(newNote);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    
    // Check if dropped on a folder
    if (overId.startsWith("folder-")) {
      const targetFolderId = over.data.current?.folderId as string | null;
      const noteId = active.id as string;
      
      // Find the note being dragged
      const draggedNote = notes.find(n => n.id === noteId);
      if (!draggedNote) return;
      
      // Don't move if it's already in the same folder
      if (draggedNote.folder_id === targetFolderId) return;
      
      handleMoveNote(noteId, targetFolderId);
    }
  };

  const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          onOpenFolderAI={handleOpenFolderAI}
        />

        {/* Center Column - Notes List */}
        <SortableContext
          items={filteredNotes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
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
            onOpenAIWithNotes={handleOpenAIWithNotes}
          />
        </SortableContext>

        {/* Right Column - Note Editor */}
        <NoteEditor
          note={selectedNote}
          folders={userFolders}
          onOpenAIPanel={handleOpenSingleNoteAI}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onRestoreNote={handleRestoreNote}
          isTrashView={selectedFolder === "trash"}
        />

        {/* AI Chat Panel - Slide-out */}
        <AIChatPanel
          isOpen={isAIPanelOpen}
          onClose={() => {
            setIsAIPanelOpen(false);
            setAiFolderNotes(null);
            setAiFolderName(undefined);
          }}
          note={aiFolderNotes ? null : selectedNote}
          notes={aiFolderNotes || undefined}
          folderName={aiFolderName}
          onApplyContent={handleApplyAIContent}
          onCreateNote={handleCreateNoteFromAI}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeNote ? (
          <div className="w-64 p-3 rounded-xl bg-card border border-primary/30 shadow-lg">
            <h3 className="font-medium text-sm truncate text-foreground">
              {activeNote.title || "Untitled"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {activeNote.content?.slice(0, 50) || "No content"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Dashboard;