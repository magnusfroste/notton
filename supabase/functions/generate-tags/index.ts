import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIConfig {
  provider: "openai" | "xai";
  model: string;
  enabled: boolean;
}

const PROVIDER_CONFIG = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
  },
  xai: {
    url: "https://api.x.ai/v1/chat/completions",
    envKey: "XAI_API_KEY",
  },
};

async function getAIConfig(): Promise<AIConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "ai_config").single();

  if (error || !data) {
    return { provider: "openai", model: "gpt-4o-mini", enabled: true };
  }

  return data.value as AIConfig;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();

    const aiConfig = await getAIConfig();

    if (!aiConfig.enabled) {
      return new Response(JSON.stringify({ error: "AI features are currently disabled" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerConfig = PROVIDER_CONFIG[aiConfig.provider];
    const apiKey = Deno.env.get(providerConfig.envKey);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `${aiConfig.provider === "openai" ? "OpenAI" : "xAI"} API key not configured` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Generate tags request:", {
      provider: aiConfig.provider,
      model: aiConfig.model,
      noteTitle: title,
    });

    const systemPrompt = `You are an AI assistant that generates concise, relevant tags for notes. Analyze the note title and content to suggest 2-5 tags.

Guidelines:
- Tags should be short (1-2 words max)
- Use lowercase
- Be specific and relevant
- Focus on topics, themes, categories, or key concepts
- Avoid generic tags like "note" or "document"
- Return tags that would help with organization and search`;

    const userPrompt = `Note title: "${title}"

Note content:
${content || "(empty note)"}

Generate 2-5 relevant tags for this note.`;

    const response = await fetch(providerConfig.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tags",
              description: "Return 2-5 relevant tags for the note",
              parameters: {
                type: "object",
                properties: {
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of 2-5 short, relevant tags",
                  },
                },
                required: ["tags"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_tags" } },
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${aiConfig.provider} API error:`, response.status, errorText);
      throw new Error(`${aiConfig.provider} API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "suggest_tags") {
      throw new Error("No tool call returned from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    const tags = result.tags || [];

    console.log("Generated tags:", tags);

    return new Response(JSON.stringify({ tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-tags function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
