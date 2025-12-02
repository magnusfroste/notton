import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTagSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTags = async (title: string, content: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke("generate-tags", {
        body: { title, content },
      });

      if (functionError) throw functionError;
      if (!data?.tags) throw new Error("No tags returned");

      return data.tags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate tags";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateTags, isLoading, error };
}
