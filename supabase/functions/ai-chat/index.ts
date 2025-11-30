import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, noteContent, noteTitle, action } = await req.json();
    
    console.log('AI Chat request:', { action, noteTitle, messagesCount: messages?.length });

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Build system prompt based on action
    let systemPrompt = `You are an AI assistant for a notes application called Tahoe Notes. You help users edit, improve, summarize, and generate content for their notes.

Current note title: "${noteTitle || 'Untitled'}"
Current note content:
"""
${noteContent || '(empty note)'}
"""

Guidelines:
- Be concise and helpful
- When asked to improve or edit content, provide the improved text directly
- When summarizing, be brief but capture key points
- When generating ideas, provide actionable suggestions
- Format your responses with proper paragraphs and lists when appropriate
- If asked to generate content, write in a clear, professional style`;

    if (action === 'improve') {
      systemPrompt += `\n\nThe user wants to improve the writing in their note. Analyze the content and provide an improved version with better grammar, clarity, and flow. Return ONLY the improved content, nothing else.`;
    } else if (action === 'summarize') {
      systemPrompt += `\n\nThe user wants a summary of their note. Provide a concise summary capturing the key points.`;
    } else if (action === 'tasks') {
      systemPrompt += `\n\nThe user wants to extract action items from their note. List any tasks, to-dos, or action items mentioned in the content as a bullet list.`;
    } else if (action === 'ideas') {
      systemPrompt += `\n\nThe user wants related ideas for their note. Suggest 3-5 related ideas or topics they could explore or add to their note.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
