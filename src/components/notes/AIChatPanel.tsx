import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Sparkles,
  Send,
  FileText,
  Wand2,
  ListChecks,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/hooks/useNotes";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

const quickActions = [
  { icon: Wand2, label: "Improve writing", action: "improve" },
  { icon: FileText, label: "Summarize", action: "summarize" },
  { icon: ListChecks, label: "Extract tasks", action: "tasks" },
  { icon: Lightbulb, label: "Generate ideas", action: "ideas" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel({ isOpen, onClose, note }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm ready to help you with your note! Once the AI integration is set up with Lovable Cloud, I'll be able to edit, summarize, and generate content for you.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      improve: "Improve the writing in this note",
      summarize: "Summarize this note concisely",
      tasks: "Extract action items from this note",
      ideas: "Generate related ideas for this note",
    };
    setInput(prompts[action] || "");
  };

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
        {note && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">Working with: {note.title}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  "bg-muted/50 text-foreground/80",
                  "hover:bg-muted hover:text-foreground",
                  "transition-colors duration-150"
                )}
              >
                <action.icon className="h-3.5 w-3.5" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto tahoe-scrollbar p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-3 rounded-2xl bg-[hsl(var(--ai-accent))]/10 mb-3">
                <Sparkles className="h-6 w-6 text-[hsl(var(--ai-accent))]" />
              </div>
              <p className="text-sm text-foreground font-medium">
                How can I help?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask me to edit, summarize, or generate content
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))
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
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask AI anything..."
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-sm",
                  "bg-muted text-foreground",
                  "placeholder:text-muted-foreground/60",
                  "border-0 outline-none",
                  "focus:ring-2 focus:ring-[hsl(var(--ai-accent))]/30",
                  "transition-all duration-200"
                )}
              />
            </div>
            <Button
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl shrink-0",
                "bg-[hsl(var(--ai-accent))] hover:bg-[hsl(var(--ai-accent))]/90",
                "text-white"
              )}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
