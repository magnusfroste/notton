import { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link as LinkIcon,
  Sparkles,
  MoreHorizontal,
  Share,
  Trash2,
  Heading1,
  Heading2,
  Quote,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/hooks/useNotes";
import { format } from "date-fns";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

interface NoteEditorProps {
  note: Note | null;
  onOpenAIPanel: () => void;
  onUpdateNote: (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id">>) => Promise<void>;
  onDeleteNote: () => Promise<void>;
  onRestoreNote: () => Promise<void>;
  isTrashView?: boolean;
}

export function NoteEditor({
  note,
  onOpenAIPanel,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  isTrashView,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");

  const debouncedUpdateContent = useDebouncedCallback(
    (content: string) => {
      if (note) {
        onUpdateNote(note.id, { content });
      }
    },
    500
  );

  const debouncedUpdateTitle = useDebouncedCallback(
    (newTitle: string) => {
      if (note) {
        onUpdateNote(note.id, { title: newTitle });
      }
    },
    500
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
    ],
    content: note?.content || "",
    editable: !isTrashView,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-280px)]",
      },
    },
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      debouncedUpdateContent(markdown);
    },
  });

  useEffect(() => {
    if (editor && note) {
      const currentContent = editor.getHTML();
      if (currentContent !== note.content) {
        editor.commands.setContent(note.content || "");
      }
      setTitle(note.title || "");
      editor.setEditable(!isTrashView);
    }
  }, [note?.id, editor, isTrashView]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdateTitle(newTitle);
  };

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

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const formatActions = [
    {
      icon: Bold,
      label: "Bold",
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive("italic"),
    },
    {
      icon: UnderlineIcon,
      label: "Underline",
      action: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: editor?.isActive("underline"),
    },
    { icon: null, label: "divider" },
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor?.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor?.isActive("heading", { level: 2 }),
    },
    { icon: null, label: "divider" },
    {
      icon: List,
      label: "Bullet List",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: editor?.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: editor?.isActive("orderedList"),
    },
    {
      icon: CheckSquare,
      label: "Checklist",
      action: () => editor?.chain().focus().toggleTaskList().run(),
      isActive: editor?.isActive("taskList"),
    },
    { icon: null, label: "divider" },
    {
      icon: Quote,
      label: "Quote",
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: editor?.isActive("blockquote"),
    },
    {
      icon: Code,
      label: "Code Block",
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: editor?.isActive("codeBlock"),
    },
    {
      icon: Minus,
      label: "Horizontal Rule",
      action: () => editor?.chain().focus().setHorizontalRule().run(),
      isActive: false,
    },
    {
      icon: LinkIcon,
      label: "Add Link",
      action: addLink,
      isActive: editor?.isActive("link"),
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        {/* Format Actions */}
        {!isTrashView && (
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
                  onClick={action.action}
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted",
                    action.isActive && "bg-muted text-foreground"
                  )}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              )
            )}
          </div>
        )}
        {isTrashView && (
          <div className="text-sm text-muted-foreground">
            This note is in trash
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* AI Button - Prominent */}
          {!isTrashView && (
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
          )}

          <div className="w-px h-5 bg-border mx-1" />

          {isTrashView ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestoreNote}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Restore</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteNote}
                className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Delete Forever</span>
              </Button>
            </>
          ) : (
            <>
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
                onClick={onDeleteNote}
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
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto tahoe-scrollbar">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Note Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isTrashView}
            className={cn(
              "w-full text-3xl font-semibold text-foreground",
              "bg-transparent border-0 outline-none",
              "placeholder:text-muted-foreground/40",
              isTrashView && "cursor-not-allowed"
            )}
            placeholder="Note title"
          />

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 mb-6">
            <span className="text-xs text-muted-foreground">
              Last edited {format(new Date(note.updated_at), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {/* TipTap Editor */}
          <EditorContent editor={editor} className="tiptap-editor" />
        </div>
      </div>
    </div>
  );
}
