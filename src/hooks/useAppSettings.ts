import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface AIConfig {
  provider: 'openai' | 'xai';
  model: string;
  enabled: boolean;
}

export const useAppSettings = () => {
  const { session } = useAuth();
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('key', 'ai_config')
        .single();

      if (error) {
        console.error('Error fetching AI settings:', error);
        return;
      }

      if (data) {
        setAIConfig(data.value as unknown as AIConfig);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateAIConfig = async (newConfig: AIConfig) => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: newConfig as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id
        })
        .eq('key', 'ai_config');

      if (error) {
        console.error('Error updating AI settings:', error);
        toast.error('Failed to update AI settings');
        return false;
      }

      setAIConfig(newConfig);
      toast.success('AI settings updated');
      return true;
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error('Failed to update AI settings');
      return false;
    }
  };

  return { aiConfig, isLoading, updateAIConfig, refetch: fetchSettings };
};
