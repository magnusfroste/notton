import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, SortDesc, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/hooks/useNotes";
import { format } from "date-fns";
import { toast } from "sonner";

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNote: () => void;
  onImportNote?: (title: string, content: string) => Promise<Note | null>;
  isTrashView?: boolean;
}

export function NotesList({
  notes,
  selectedNote,
  onSelectNote,
  searchQuery,
  onSearchChange,
  onCreateNote,
  onImportNote,
  isTrashView,
}: NotesListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Extract title from filename (without .md extension)
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

    // Reset input
    e.target.value = "";
  };
  return (
    <div className="flex flex-col w-72 h-full border-r border-border bg-card">
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
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
          <div className="flex items-center gap-1">
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
              <button
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-150",
                  selectedNote?.id === note.id
                    ? "bg-primary/15 border border-primary/20"
                    : "hover:bg-muted/50 border border-transparent"
                )}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
