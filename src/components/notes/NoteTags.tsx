import { useState } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTagSuggestions } from "@/hooks/useTagSuggestions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NoteTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  noteTitle: string;
  noteContent: string;
}

export function NoteTags({ tags, onTagsChange, noteTitle, noteContent }: NoteTagsProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { generateTags, isLoading } = useTagSuggestions();

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !tags.includes(normalized)) {
      onTagsChange([...tags, normalized]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleGenerateTags = async () => {
    try {
      const suggested = await generateTags(noteTitle, noteContent);
      // Filter out tags that already exist
      const newSuggestions = suggested.filter((t) => !tags.includes(t.toLowerCase()));
      setSuggestedTags(newSuggestions);
      setShowSuggestions(true);
      if (newSuggestions.length === 0) {
        toast.info("All suggested tags are already added");
      }
    } catch (err) {
      toast.error("Failed to generate tags");
    }
  };

  const addSuggestedTag = (tag: string) => {
    addTag(tag);
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {/* Current Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="pl-2 pr-1 py-1 text-xs bg-muted hover:bg-muted/80"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Add Tag Input */}
        <div className="flex items-center gap-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Add tag..."
            className="h-7 w-32 text-xs bg-background"
          />
          {inputValue && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => addTag(inputValue)}
              className="h-7 w-7"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* AI Suggest Button */}
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateTags}
              disabled={isLoading}
              className={cn(
                "h-7 px-2 text-xs gap-1",
                "border-[hsl(var(--ai-accent))]/20 text-[hsl(var(--ai-accent))]",
                "hover:bg-[hsl(var(--ai-accent))]/10 hover:text-[hsl(var(--ai-accent))]"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {isLoading ? "Generating..." : "Suggest Tags"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-[hsl(var(--ai-accent))]" />
                Suggested Tags
              </div>
              {suggestedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => addSuggestedTag(tag)}
                      className="h-7 px-2 text-xs hover:bg-[hsl(var(--ai-accent))]/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click "Suggest Tags" to generate AI-powered tag suggestions
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
