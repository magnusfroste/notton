import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import generatePDF from "react-to-pdf";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
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
  Download,
  Trash2,
  Heading1,
  Heading2,
  Quote,
  Minus,
  RotateCcw,
  FileText,
  FolderInput,
  Folder as FolderIcon,
  FileCode,
  Eye,
  Info,
  Copy,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Note, Folder } from "@/hooks/useNotes";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { toast } from "sonner";

interface NoteEditorProps {
  note: Note | null;
  folders: Folder[];
  onOpenAIPanel: () => void;
  onUpdateNote: (id: string, updates: Partial<Pick<Note, "title" | "content" | "folder_id">>) => Promise<void>;
  onDeleteNote: () => Promise<void>;
  onRestoreNote: () => Promise<void>;
  onDuplicateNote?: () => void;
  isTrashView?: boolean;
}

export function NoteEditor({
  note,
  folders,
  onOpenAIPanel,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onDuplicateNote,
  isTrashView,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [rawMarkdown, setRawMarkdown] = useState(note?.content || "");
  const [showNoteInfo, setShowNoteInfo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const noteIdRef = useRef<string | null>(note?.id || null);
  const previousNoteIdRef = useRef<string | null>(null);
  const { editorMode, showLineNumbers, fontSize, updatePreferences } = useProfile();
  const rawMarkdownRef = useRef(rawMarkdown);
  const prevEditorModeRef = useRef(editorMode);

  // Font size class mapping
  const fontSizeClasses = {
    'small': 'prose-sm',
    'medium': 'prose-base',
    'large': 'prose-lg',
    'extra-large': 'prose-xl',
  };

  const codeMirrorFontSizes = {
    'small': '13px',
    'medium': '15px',
    'large': '17px',
    'extra-large': '19px',
  };

  // Calculate word and character count
  const content = rawMarkdown || note?.content || "";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Pass noteId at call time to avoid stale closure issues
  const debouncedUpdateContent = useDebouncedCallback(
    (noteId: string, content: string) => {
      // Only save if we're still on the same note
      if (noteIdRef.current === noteId) {
        onUpdateNote(noteId, { content });
        setIsDirty(false);
      }
    },
    500
  );

  const debouncedUpdateTitle = useDebouncedCallback(
    (noteId: string, newTitle: string) => {
      // Only save if we're still on the same note
      if (noteIdRef.current === noteId) {
        onUpdateNote(noteId, { title: newTitle });
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
      Link.extend({ name: 'customLink' }).configure({
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
        linkify: false, // Prevent markdown from adding its own link extension
      }),
    ],
    content: note?.content || "",
    editable: !isTrashView,
    editorProps: {
      attributes: {
        class: `prose prose-invert ${fontSizeClasses[fontSize]} max-w-none focus:outline-none min-h-[calc(100vh-280px)]`,
      },
    },
    onUpdate: ({ editor }) => {
      if (!note) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      setIsDirty(true);
      debouncedUpdateContent(note.id, markdown);
    },
  });

  // Flush pending saves and sync content when switching notes
  useEffect(() => {
    const isNewNote = note?.id !== previousNoteIdRef.current;
    
    // Only run logic when actually switching to a different note
    if (!isNewNote) {
      // Just update editable state if needed
      if (editor) {
        editor.setEditable(!isTrashView);
      }
      return;
    }
    
    // Switching notes - flush any pending saves for the old note
    if (previousNoteIdRef.current) {
      debouncedUpdateContent.flush();
      debouncedUpdateTitle.flush();
    }
    
    // Update refs
    previousNoteIdRef.current = note?.id || null;
    noteIdRef.current = note?.id || null;
    
    // Reset content for the new note
    if (note) {
      setRawMarkdown(note.content || "");
      setTitle(note.title || "");
      setIsDirty(false);
      
      if (editor) {
        editor.commands.setContent(note.content || "");
        editor.setEditable(!isTrashView);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, editor, isTrashView]);

  // Keep ref synced with latest markdown value for mode transitions
  useEffect(() => {
    rawMarkdownRef.current = rawMarkdown;
  }, [rawMarkdown]);

  // Sync content only when switching between rich and markdown modes
  useEffect(() => {
    if (!editor) return;

    const prevMode = prevEditorModeRef.current;
    if (prevMode === editorMode) return;

    if (editorMode === 'markdown') {
      // Capture current rich-text content before entering markdown mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      setRawMarkdown(markdown);
      rawMarkdownRef.current = markdown;
    } else if (editorMode === 'rich') {
      // Restore markdown content back into the rich editor when leaving markdown mode
      const markdownContent = rawMarkdownRef.current ?? note?.content ?? "";
      editor.commands.setContent(markdownContent || "");
    }

    prevEditorModeRef.current = editorMode;
  }, [editorMode, editor, note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdateTitle(note.id, newTitle);
  };

  const toggleEditorMode = useCallback(() => {
    const newMode = editorMode === 'rich' ? 'markdown' : 'rich';
    updatePreferences.mutate({ editor_mode: newMode });
    toast.success(newMode === 'markdown' ? 'Switched to Markdown mode' : 'Switched to Rich Text mode');
  }, [editorMode, updatePreferences]);

  // Keyboard shortcut for toggling mode (Cmd/Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleEditorMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleEditorMode]);

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

  const exportNote = () => {
    const markdown = rawMarkdown || note.content || "";
    const filename = `${note.title || "untitled"}.md`;
    
    // Create blob with markdown content, adding title as H1 header
    const content = `# ${note.title || "Untitled"}\n\n${markdown}`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Note exported as markdown");
  };

  const exportPDF = () => {
    if (pdfContentRef.current) {
      generatePDF(pdfContentRef, {
        filename: `${note.title || "untitled"}.pdf`,
        page: {
          margin: 20,
          format: "a4",
        },
      });
      toast.success("Note exported as PDF");
    }
  };

  const copyAsMarkdown = async () => {
    const markdown = rawMarkdown || note.content || "";
    const content = `# ${note.title || "Untitled"}\n\n${markdown}`;
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const printNote = () => {
    window.print();
  };

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
        {/* Format Actions - only show in rich mode */}
        {!isTrashView && editorMode === 'rich' && (
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
        {!isTrashView && editorMode === 'markdown' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCode className="h-4 w-4" />
              <span>Markdown Mode</span>
            </div>
            <div className="w-px h-4 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePreferences.mutate({ show_line_numbers: !showLineNumbers })}
                  className={cn(
                    "h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
                    showLineNumbers && "bg-muted text-foreground"
                  )}
                >
                  <span className="font-mono mr-1.5 text-[10px] opacity-60">123</span>
                  Lines
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle line numbers</TooltipContent>
            </Tooltip>
          </div>
        )}
        {isTrashView && (
          <div className="text-sm text-muted-foreground">
            This note is in trash
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Editor Mode Toggle */}
          {!isTrashView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleEditorMode}
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground",
                    editorMode === 'markdown' && "bg-muted text-foreground"
                  )}
                >
                  {editorMode === 'rich' ? (
                    <FileCode className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {editorMode === 'rich' ? 'Switch to Markdown mode' : 'Switch to Rich Text mode'}
                <span className="ml-2 text-xs opacity-60">⌘/</span>
              </TooltipContent>
            </Tooltip>
          )}
          
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Export"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={exportNote}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Move to folder"
                  >
                    <FolderInput className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem 
                    onClick={() => {
                      onUpdateNote(note.id, { folder_id: null });
                      toast.success("Note moved to All Notes");
                    }}
                    className={!note.folder_id ? "bg-muted" : ""}
                  >
                    <FolderIcon className="h-4 w-4 mr-2" />
                    No Folder
                  </DropdownMenuItem>
                  {folders.length > 0 && <DropdownMenuSeparator />}
                  {folders.map((folder) => (
                    <DropdownMenuItem 
                      key={folder.id}
                      onClick={() => {
                        onUpdateNote(note.id, { folder_id: folder.id });
                        toast.success(`Note moved to ${folder.name}`);
                      }}
                      className={note.folder_id === folder.id ? "bg-muted" : ""}
                    >
                      <FolderIcon className="h-4 w-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteNote}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => setShowNoteInfo(true)}>
                    <Info className="h-4 w-4 mr-2" />
                    Note Info
                  </DropdownMenuItem>
                  {onDuplicateNote && (
                    <DropdownMenuItem onClick={onDuplicateNote}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Note
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={copyAsMarkdown}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printNote}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto notton-scrollbar">
        <div ref={pdfContentRef} className="max-w-3xl mx-auto px-8 py-8">
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

          {/* Editor - Rich Text or Raw Markdown */}
          {editorMode === 'markdown' ? (
            <CodeMirror
              value={rawMarkdown}
              onChange={(value) => {
                if (!note) return;
                setRawMarkdown(value);
                setIsDirty(true);
                debouncedUpdateContent(note.id, value);
              }}
              editable={!isTrashView}
              extensions={[
                markdown({ base: markdownLanguage, codeLanguages: languages }),
                EditorView.lineWrapping,
                EditorView.theme({
                  "&": {
                    backgroundColor: "transparent",
                    fontSize: codeMirrorFontSizes[fontSize],
                  },
                  ".cm-content": {
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    padding: "0",
                    caretColor: "hsl(var(--foreground))",
                  },
                  ".cm-line": {
                    padding: "0",
                    lineHeight: "1.7",
                  },
                  ".cm-gutters": {
                    backgroundColor: "transparent",
                    borderRight: showLineNumbers ? "1px solid hsl(var(--border))" : "none",
                    color: "hsl(var(--muted-foreground))",
                    paddingRight: showLineNumbers ? "8px" : "0",
                  },
                  ".cm-lineNumbers .cm-gutterElement": {
                    padding: "0 8px 0 0",
                    minWidth: "40px",
                    fontSize: "12px",
                  },
                  ".cm-cursor": {
                    borderLeftColor: "hsl(var(--foreground))",
                  },
                  ".cm-selectionBackground, .cm-content ::selection": {
                    backgroundColor: "hsl(var(--primary) / 0.3) !important",
                  },
                  ".cm-activeLine": {
                    backgroundColor: "transparent",
                  },
                  "&.cm-focused .cm-activeLine": {
                    backgroundColor: "hsl(var(--muted) / 0.3)",
                  },
                  "&.cm-focused": {
                    outline: "none",
                  },
                }),
              ]}
              theme="dark"
              placeholder="# Start writing in markdown..."
              className="min-h-[calc(100vh-280px)] [&_.cm-editor]:bg-transparent [&_.cm-scroller]:overflow-visible"
              basicSetup={{
                lineNumbers: showLineNumbers,
                foldGutter: false,
                highlightActiveLineGutter: showLineNumbers,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
                rectangularSelection: true,
                crosshairCursor: false,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                searchKeymap: true,
                foldKeymap: false,
                completionKeymap: false,
                lintKeymap: false,
              }}
            />
          ) : (
            <EditorContent editor={editor} className="tiptap-editor" />
          )}
        </div>
      </div>

      {/* Note Info Dialog */}
      <Dialog open={showNoteInfo} onOpenChange={setShowNoteInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Modified</p>
                <p className="font-medium">{format(new Date(note.updated_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Words</p>
                <p className="font-medium">{wordCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Characters</p>
                <p className="font-medium">{charCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
