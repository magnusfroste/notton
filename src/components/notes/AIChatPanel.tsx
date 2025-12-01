import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  X,
  Sparkles,
  Send,
  FileText,
  Wand2,
  ListChecks,
  Lightbulb,
  Copy,
  Check,
  Loader2,
  Combine,
  GitCompare,
  TrendingUp,
  FolderOpen,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/hooks/useNotes";
import { useAIChat, NoteInput } from "@/hooks/useAIChat";
import { toast } from "sonner";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  notes?: Note[]; // For multi-note operations
  folderName?: string; // Name of folder when working with multiple notes
  onApplyContent?: (content: string) => void;
  onCreateNote?: (title: string, content: string) => void;
}

const singleNoteActions = [
  { icon: Wand2, label: "Improve writing", action: "improve", prompt: "Improve the writing in this note" },
  { icon: FileText, label: "Summarize", action: "summarize", prompt: "Summarize this note concisely" },
  { icon: ListChecks, label: "Extract tasks", action: "tasks", prompt: "Extract action items from this note" },
  { icon: Lightbulb, label: "Generate ideas", action: "ideas", prompt: "Generate related ideas for this note" },
];

const multiNoteActions = [
  { icon: Combine, label: "Consolidate", action: "consolidate", prompt: "Consolidate these notes into one master document" },
  { icon: GitCompare, label: "Compare", action: "compare", prompt: "Compare these notes and highlight differences" },
  { icon: TrendingUp, label: "Find patterns", action: "patterns", prompt: "Identify patterns across these notes" },
  { icon: FileText, label: "Summary", action: "multi-summarize", prompt: "Create a summary of all these notes" },
];

// Code block component with copy button
function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={cn(
          "absolute right-2 top-2 p-1.5 rounded-md",
          "bg-background/80 hover:bg-background",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-foreground"
        )}
        title="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: "0.5rem 0",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export function AIChatPanel({ 
  isOpen, 
  onClose, 
  note, 
  notes,
  folderName,
  onApplyContent,
  onCreateNote 
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMultiNote = notes && notes.length > 1;
  const quickActions = isMultiNote ? multiNoteActions : singleNoteActions;

  // Clear messages when note/notes change
  useEffect(() => {
    clearMessages();
  }, [note?.id, notes?.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (customPrompt?: string, action?: string) => {
    const message = customPrompt || input.trim();
    if (!message) return;
    
    setInput("");
    
    if (isMultiNote && notes) {
      // Multi-note: send array of notes
      const noteInputs: NoteInput[] = notes.map(n => ({ title: n.title, content: n.content }));
      await sendMessage(message, noteInputs, undefined, action);
    } else if (note) {
      // Single note: send content and title
      await sendMessage(message, note.content || "", note.title || "", action);
    }
  };

  const handleQuickAction = (action: typeof singleNoteActions[0]) => {
    handleSend(action.prompt, action.action);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (content: string) => {
    if (onApplyContent && !isMultiNote) {
      onApplyContent(content);
      toast.success("Applied to note");
    }
  };

  const handleCreateNewNote = (content: string) => {
    if (onCreateNote) {
      // Generate title from first line or action
      const firstLine = content.split('\n')[0].replace(/^#*\s*/, '').slice(0, 50);
      const title = firstLine || "AI Generated Note";
      onCreateNote(title, content);
      toast.success("Created new note");
    }
  };

  // Context description
  const contextText = isMultiNote && notes
    ? `Working with ${notes.length} notes${folderName ? ` in "${folderName}"` : ""}`
    : note
    ? `Working with: ${note.title || "Untitled"}`
    : "No note selected";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 z-50",
          "bg-card border-l border-border",
          "flex flex-col",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[hsl(var(--ai-accent))]/15">
              <Sparkles className="h-4 w-4 text-[hsl(var(--ai-accent))]" />
            </div>
            <span className="font-medium text-foreground">AI Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Context Badge */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isMultiNote ? (
              <FolderOpen className="h-3.5 w-3.5" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{contextText}</span>
          </div>
          {isMultiNote && notes && (
            <div className="mt-2 flex flex-wrap gap-1">
              {notes.slice(0, 5).map((n) => (
                <span 
                  key={n.id} 
                  className="text-[10px] px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground truncate max-w-[100px]"
                >
                  {n.title || "Untitled"}
                </span>
              ))}
              {notes.length > 5 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">
                  +{notes.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">
            {isMultiNote ? "Multi-note actions" : "Quick actions"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  "bg-muted/50 text-foreground/80",
                  "hover:bg-muted hover:text-foreground",
                  "transition-colors duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <action.icon className="h-3.5 w-3.5" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto notton-scrollbar p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-2xl bg-[hsl(var(--ai-accent))]/10 mb-3">
                <Sparkles className="h-6 w-6 text-[hsl(var(--ai-accent))]" />
              </div>
              <p className="text-sm text-foreground font-medium">
                How can I help?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isMultiNote 
                  ? "Consolidate, compare, or analyze multiple notes"
                  : "Ask me to edit, summarize, or generate content"
                }
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                        : "bg-muted text-foreground rounded-bl-md prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:bg-background/50 prose-code:px-1 prose-code:rounded max-w-none"
                    )}
                  >
                    {message.role === "user" ? (
                      message.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            const isInline = !match && !codeString.includes("\n");
                            return isInline ? (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            ) : (
                              <CodeBlock language={match?.[1] || "text"}>
                                {codeString}
                              </CodeBlock>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        Copy
                      </Button>
                      {!isMultiNote && onApplyContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[hsl(var(--ai-accent))] hover:text-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))]/10"
                          onClick={() => handleApply(message.content)}
                        >
                          Apply to Note
                        </Button>
                      )}
                      {onCreateNote && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[hsl(var(--ai-accent))] hover:text-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))]/10"
                          onClick={() => handleCreateNewNote(message.content)}
                        >
                          <FilePlus className="h-3 w-3 mr-1" />
                          Create Note
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-start">
                  <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder="Ask AI anything..."
                disabled={isLoading}
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-sm",
                  "bg-muted text-foreground",
                  "placeholder:text-muted-foreground/60",
                  "border-0 outline-none",
                  "focus:ring-2 focus:ring-[hsl(var(--ai-accent))]/30",
                  "transition-all duration-200",
                  "disabled:opacity-50"
                )}
              />
            </div>
            <Button
              size="icon"
              disabled={isLoading || !input.trim()}
              className={cn(
                "h-10 w-10 rounded-xl shrink-0",
                "bg-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))]/90",
                "text-white",
                "disabled:opacity-50"
              )}
              onClick={() => handleSend()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}