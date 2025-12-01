import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NoteInput {
  title: string;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, noteContent, noteTitle, notes, action } = await req.json();
    
    // Support both single note (legacy) and multi-note format
    const notesList: NoteInput[] = notes || [{ title: noteTitle || 'Untitled', content: noteContent || '' }];
    const isMultiNote = notesList.length > 1;
    
    console.log('AI Chat request:', { action, notesCount: notesList.length, messagesCount: messages?.length });

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Build context based on single or multi-note
    let notesContext: string;
    if (isMultiNote) {
      notesContext = notesList.map((note, i) => 
        `### Note ${i + 1}: "${note.title}"\n\`\`\`markdown\n${note.content || '(empty)'}\n\`\`\``
      ).join('\n\n');
    } else {
      notesContext = `Current note title: "${notesList[0].title}"\nCurrent note content (Markdown):\n\`\`\`markdown\n${notesList[0].content || '(empty note)'}\n\`\`\``;
    }

    // Build system prompt based on action
    let systemPrompt = `You are an AI assistant for a notes application called Tahoe Notes. You help users edit, improve, summarize, and generate content for their notes.

The note content is stored in **Markdown format**. You MUST understand and preserve Markdown syntax.

${isMultiNote ? `You have access to ${notesList.length} notes:\n\n${notesContext}` : notesContext}

Guidelines:
- Be concise and helpful
- **Always return content in Markdown format**
- Preserve existing Markdown formatting (headers, lists, bold, italic, links, code blocks, etc.)
- When asked to improve or edit content, return properly formatted Markdown
- When summarizing, use Markdown formatting (bullet points, headers if appropriate)
- When generating ideas, format as a Markdown list
- Use proper Markdown syntax: # for headers, - or * for lists, **bold**, *italic*, \`code\`, etc.
- For task lists, use - [ ] syntax for unchecked and - [x] for checked items`;

    // Single-note actions
    if (action === 'improve') {
      systemPrompt += `\n\nThe user wants to improve the writing in their note. Analyze the Markdown content and provide an improved version with better grammar, clarity, and flow. Return ONLY the improved Markdown content, preserving and enhancing the formatting.`;
    } else if (action === 'summarize') {
      systemPrompt += `\n\nThe user wants a summary of their note. Provide a concise summary in Markdown format, using bullet points for key points.`;
    } else if (action === 'tasks') {
      systemPrompt += `\n\nThe user wants to extract action items from their note. List any tasks, to-dos, or action items as a Markdown task list using - [ ] syntax.`;
    } else if (action === 'ideas') {
      systemPrompt += `\n\nThe user wants related ideas for their note. Suggest 3-5 related ideas formatted as a Markdown list with brief descriptions.`;
    }
    // Multi-note actions
    else if (action === 'consolidate') {
      systemPrompt += `\n\nThe user wants to consolidate these ${notesList.length} notes into ONE comprehensive master document. Analyze all notes, identify:
- Common themes and content
- Best descriptions and phrasings from each
- Unique elements worth keeping
- Redundant or duplicate content to merge

Create a well-organized master document in Markdown that combines the best elements from all notes. Use clear headers and sections.`;
    } else if (action === 'compare') {
      systemPrompt += `\n\nThe user wants to compare these ${notesList.length} notes. Analyze and highlight:
- **Similarities**: Common themes, shared content, overlapping ideas
- **Differences**: Unique elements in each note, variations in approach
- **Gaps**: What one note has that others don't

Format as a clear comparison report in Markdown.`;
    } else if (action === 'patterns') {
      systemPrompt += `\n\nThe user wants to identify patterns and trends across these ${notesList.length} notes. Analyze for:
- Recurring themes or topics
- Common phrases or terminology
- Trends over the notes
- Key insights that emerge from the collection

Format findings as a Markdown report with clear sections.`;
    } else if (action === 'multi-summarize') {
      systemPrompt += `\n\nThe user wants a summary of all ${notesList.length} notes combined. Create a comprehensive summary that:
- Captures the key points from each note
- Identifies overarching themes
- Provides a high-level overview

Format as Markdown with bullet points for key insights.`;
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
