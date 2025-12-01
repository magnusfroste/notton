import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, SortDesc, Upload, Copy, Trash2, FolderInput, Folder as FolderIcon, CheckSquare, Square, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Note, Folder } from "@/hooks/useNotes";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNote: () => void;
  onImportNote?: (title: string, content: string) => Promise<Note | null>;
  onDuplicateNote?: (note: Note) => void;
  onDeleteNote?: (note: Note) => void;
  onMoveNote?: (noteId: string, folderId: string | null) => void;
  folders?: Folder[];
  isTrashView?: boolean;
  onOpenAIWithNotes?: (notes: Note[]) => void;
}

export function NotesList({
  notes,
  selectedNote,
  onSelectNote,
  searchQuery,
  onSearchChange,
  onCreateNote,
  onImportNote,
  onDuplicateNote,
  onDeleteNote,
  onMoveNote,
  folders = [],
  isTrashView,
  onOpenAIWithNotes,
}: NotesListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onImportNote) return;

    let imported = 0;
    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".md")) {
        toast.error(`Skipped ${file.name}: Not a markdown file`);
        continue;
      }

      try {
        const content = await file.text();
        const title = file.name.replace(/\.md$/, "");
        await onImportNote(title, content);
        imported++;
      } catch (error) {
        toast.error(`Failed to import ${file.name}`);
      }
    }

    if (imported > 0) {
      toast.success(`Imported ${imported} note${imported > 1 ? "s" : ""}`);
    }

    e.target.value = "";
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedNotes(new Set());
    }
    setIsSelectMode(!isSelectMode);
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedNotes(new Set(notes.map((n) => n.id)));
  };

  const clearSelection = () => {
    setSelectedNotes(new Set());
    setIsSelectMode(false);
  };

  const handleAIWithSelected = () => {
    if (selectedNotes.size === 0) return;
    const selected = notes.filter((n) => selectedNotes.has(n.id));
    onOpenAIWithNotes?.(selected);
  };

  const handleDeleteSelected = () => {
    if (selectedNotes.size === 0) return;
    const selected = notes.filter((n) => selectedNotes.has(n.id));
    selected.forEach((n) => onDeleteNote?.(n));
    clearSelection();
  };

  return (
    <div className="flex flex-col w-72 h-full border-r border-border bg-card relative">
      {/* Header with Search */}
      <div className="p-3 space-y-3">
        {/* Big Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full h-10 pl-10 pr-4 rounded-xl text-sm",
              "bg-[hsl(var(--search-background))] text-foreground",
              "placeholder:text-muted-foreground/60",
              "border-0 outline-none",
              "focus:ring-2 focus:ring-primary/30",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isSelectMode && selectedNotes.size > 0
              ? `${selectedNotes.size} selected`
              : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
          </span>
          <div className="flex items-center gap-1">
            {/* Select mode toggle */}
            {notes.length > 1 && !isTrashView && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isSelectMode
                    ? "text-primary hover:text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={toggleSelectMode}
                title={isSelectMode ? "Exit select mode" : "Select notes"}
              >
                <CheckSquare className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <SortDesc className="h-3.5 w-3.5" />
            </Button>
            {!isTrashView && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleImportClick}
                  title="Import markdown files"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={onCreateNote}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto tahoe-scrollbar px-2 pb-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-muted-foreground">
              {isTrashView ? "Trash is empty" : "No notes found"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isTrashView
                ? "Deleted notes will appear here"
                : "Try a different search or create a new note"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <ContextMenu key={note.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start gap-2",
                      selectedNote?.id === note.id && !isSelectMode
                        ? "bg-primary/15 border border-primary/20"
                        : isSelectMode && selectedNotes.has(note.id)
                        ? "bg-[hsl(var(--ai-accent))]/10 border border-[hsl(var(--ai-accent))]/20"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    {/* Checkbox in select mode */}
                    {isSelectMode && (
                      <div
                        className="pt-0.5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNoteSelection(note.id);
                        }}
                      >
                        <Checkbox
                          checked={selectedNotes.has(note.id)}
                          className="h-4 w-4 border-muted-foreground/40 data-[state=checked]:bg-[hsl(var(--ai-accent))] data-[state=checked]:border-[hsl(var(--ai-accent))]"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isSelectMode) {
                          toggleNoteSelection(note.id);
                        } else {
                          onSelectNote(note);
                        }
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <h3
                        className={cn(
                          "font-medium text-sm truncate",
                          selectedNote?.id === note.id
                            ? "text-foreground"
                            : "text-foreground/90"
                        )}
                      >
                        {note.title || "Untitled"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.updated_at), "MMM d")}
                        </span>
                        <span className="text-xs text-muted-foreground/60 truncate flex-1">
                          {note.content?.slice(0, 50) || "No content"}
                          {note.content && note.content.length > 50 ? "..." : ""}
                        </span>
                      </div>
                    </button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48 bg-popover">
                  {!isTrashView && (
                    <>
                      <ContextMenuItem onClick={() => onDuplicateNote?.(note)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <FolderInput className="h-4 w-4 mr-2" />
                          Move to folder
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48 bg-popover">
                          <ContextMenuItem
                            onClick={() => onMoveNote?.(note.id, null)}
                            className={!note.folder_id ? "bg-muted" : ""}
                          >
                            <FolderIcon className="h-4 w-4 mr-2" />
                            No Folder
                          </ContextMenuItem>
                          {folders.length > 0 && <ContextMenuSeparator />}
                          {folders.map((folder) => (
                            <ContextMenuItem
                              key={folder.id}
                              onClick={() => onMoveNote?.(note.id, folder.id)}
                              className={note.folder_id === folder.id ? "bg-muted" : ""}
                            >
                              <FolderIcon className="h-4 w-4 mr-2" />
                              {folder.name}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem
                    onClick={() => onDeleteNote?.(note)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isTrashView ? "Delete Forever" : "Delete"}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar when notes selected */}
      {isSelectMode && selectedNotes.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={selectAll}
          >
            Select all
          </Button>
          <div className="w-px h-4 bg-border" />
          {onOpenAIWithNotes && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-[hsl(var(--ai-accent))] hover:text-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))]/10"
              onClick={handleAIWithSelected}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={clearSelection}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}