import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link,
  Sparkles,
  MoreHorizontal,
  Share,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/pages/Dashboard";
import { format } from "date-fns";

interface NoteEditorProps {
  note: Note | null;
  onOpenAIPanel: () => void;
}

const formatActions = [
  { icon: Bold, label: "Bold", shortcut: "⌘B" },
  { icon: Italic, label: "Italic", shortcut: "⌘I" },
  { icon: Underline, label: "Underline", shortcut: "⌘U" },
  { icon: null, label: "divider" },
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Numbered List" },
  { icon: CheckSquare, label: "Checklist" },
  { icon: null, label: "divider" },
  { icon: Code, label: "Code Block" },
  { icon: Link, label: "Add Link" },
];

export function NoteEditor({ note, onOpenAIPanel }: NoteEditorProps) {
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Select a note to view</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        {/* Format Actions */}
        <div className="flex items-center gap-0.5">
          {formatActions.map((action, index) =>
            action.icon === null ? (
              <div
                key={`divider-${index}`}
                className="w-px h-5 bg-border mx-1.5"
              />
            ) : (
              <Button
                key={action.label}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                title={action.label}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            )
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* AI Button - Prominent */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenAIPanel}
            className={cn(
              "h-8 gap-2 px-3",
              "text-[hsl(var(--ai-accent))] hover:text-[hsl(var(--ai-accent))]",
              "hover:bg-[hsl(var(--ai-accent))]/10",
              "transition-all duration-200"
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI</span>
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto tahoe-scrollbar">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Note Title */}
          <input
            type="text"
            value={note.title}
            className={cn(
              "w-full text-3xl font-semibold text-foreground",
              "bg-transparent border-0 outline-none",
              "placeholder:text-muted-foreground/40"
            )}
            placeholder="Note title"
          />

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 mb-6">
            <span className="text-xs text-muted-foreground">
              Last edited {format(note.updatedAt, "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {/* Note Content */}
          <textarea
            value={note.content}
            className={cn(
              "w-full min-h-[calc(100vh-280px)] text-base leading-relaxed",
              "text-foreground/90 bg-transparent border-0 outline-none resize-none",
              "placeholder:text-muted-foreground/40"
            )}
            placeholder="Start writing..."
          />
        </div>
      </div>
    </div>
  );
}
