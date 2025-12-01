import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface AppConfig {
  app_name: string;
  default_theme: 'light' | 'dark' | 'system';
  allow_registrations: boolean;
}

export const AppSettingsCard = () => {
  const { session } = useAuth();
  const [config, setConfig] = useState<AppConfig>({
    app_name: 'Tahoe Notes',
    default_theme: 'dark',
    allow_registrations: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'app_config')
          .single();

        if (error) {
          console.error('Error fetching app config:', error);
          return;
        }

        if (data) {
          setConfig(data.value as unknown as AppConfig);
        }
      } catch (err) {
        console.error('Failed to fetch app config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!session) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value: config as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id,
        })
        .eq('key', 'app_config');

      if (error) {
        console.error('Error saving app config:', error);
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Application settings saved');
    } catch (err) {
      console.error('Failed to save app config:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Application Settings
        </CardTitle>
        <CardDescription>
          Configure global application settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="appName">Application Name</Label>
          <Input
            id="appName"
            value={config.app_name}
            onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
            placeholder="Enter application name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultTheme">Default Theme</Label>
          <Select
            value={config.default_theme}
            onValueChange={(value: 'light' | 'dark' | 'system') =>
              setConfig({ ...config, default_theme: value })
            }
          >
            <SelectTrigger id="defaultTheme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow New Registrations</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable new user signups
            </p>
          </div>
          <Switch
            checked={config.allow_registrations}
            onCheckedChange={(checked) =>
              setConfig({ ...config, allow_registrations: checked })
            }
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};
