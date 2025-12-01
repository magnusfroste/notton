import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface NoteInput {
  title: string;
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (
      userMessage: string,
      notesOrContent: NoteInput[] | string,
      noteTitle?: string,
      action?: string
    ) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      };
      
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantContent = "";

      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: assistantContent }];
        });
      };

      // Support both multi-note array and legacy single note params
      const isMultiNote = Array.isArray(notesOrContent);
      const body = isMultiNote
        ? {
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            notes: notesOrContent,
            action,
          }
        : {
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            noteContent: notesOrContent,
            noteTitle,
            action,
          };

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) updateAssistant(content);
            } catch {
              // Incomplete JSON, will be completed with next chunk
            }
          }
        }

        // Handle any remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) updateAssistant(content);
            } catch {
              // Ignore incomplete
            }
          }
        }

        return assistantContent;
      } catch (error) {
        console.error("AI Chat error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to get AI response");
        // Remove the user message if we failed
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
