import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

interface AppConfig {
  app_name: string;
  default_theme: 'light' | 'dark' | 'system';
  allow_registrations: boolean;
}

const THEME_STORAGE_KEY = 'theme';
const HAS_VISITED_KEY = 'tahoe_notes_has_visited';

export function DefaultThemeLoader({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const applyDefaultTheme = async () => {
      // Check if user has visited before (has explicitly set a theme preference)
      const hasVisited = localStorage.getItem(HAS_VISITED_KEY);
      
      if (hasVisited) {
        // User has visited before, respect their preference
        setIsReady(true);
        return;
      }

      // First-time visitor - fetch default theme from app settings
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'app_config')
          .maybeSingle();

        if (!error && data?.value) {
          const config = data.value as unknown as AppConfig;
          if (config.default_theme) {
            setTheme(config.default_theme);
          }
        }
      } catch (err) {
        console.error('Failed to fetch default theme:', err);
      }

      // Mark as visited so we don't override their preference on future visits
      localStorage.setItem(HAS_VISITED_KEY, 'true');
      setIsReady(true);
    };

    applyDefaultTheme();
  }, [setTheme]);

  // Render children immediately - theme will be applied async
  return <>{children}</>;
}
