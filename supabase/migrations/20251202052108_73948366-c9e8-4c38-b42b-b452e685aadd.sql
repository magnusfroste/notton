-- Add tags support to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_tags_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);

COMMENT ON COLUMN public.notes.tags IS 'Array of tags associated with the note';
COMMENT ON COLUMN public.notes.ai_tags_generated_at IS 'Timestamp when AI last generated tags for this note';