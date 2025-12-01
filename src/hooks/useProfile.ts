import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type SortBy = 'updated' | 'created' | 'title';
export type SortOrder = 'asc' | 'desc';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface ProfilePreferences {
  editor_mode: 'rich' | 'markdown';
  show_line_numbers: boolean;
  sort_by: SortBy;
  sort_order: SortOrder;
  font_size: FontSize;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: ProfilePreferences | null;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: ProfilePreferences = {
  editor_mode: 'rich',
  show_line_numbers: false,
  sort_by: 'updated',
  sort_order: 'desc',
  font_size: 'medium',
};

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      // Cast preferences from JSON to our typed interface
      const prefs = data.preferences as unknown as ProfilePreferences | null;
      return {
        ...data,
        preferences: prefs || defaultPreferences,
      } as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Profile updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<ProfilePreferences>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const currentPrefs = profile?.preferences || defaultPreferences;
      const newPrefs = { ...currentPrefs, ...updates };
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ preferences: newPrefs })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update preferences', description: error.message, variant: 'destructive' });
    },
  });

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Failed to upload avatar', description: uploadError.message, variant: 'destructive' });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const editorMode = profile?.preferences?.editor_mode || 'rich';
  const showLineNumbers = profile?.preferences?.show_line_numbers ?? false;
  const sortBy = profile?.preferences?.sort_by || 'updated';
  const sortOrder = profile?.preferences?.sort_order || 'desc';
  const fontSize = profile?.preferences?.font_size || 'medium';

  return {
    profile,
    isLoading,
    updateProfile,
    updatePreferences,
    uploadAvatar,
    editorMode,
    showLineNumbers,
    sortBy,
    sortOrder,
    fontSize,
  };
}
