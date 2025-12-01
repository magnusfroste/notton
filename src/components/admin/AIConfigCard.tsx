import { useState, useEffect } from 'react';
import { Sparkles, Key, Check, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAppSettings, AIConfig } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PROVIDER_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
    { value: 'gpt-4o', label: 'GPT-4o (Powerful)' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5', label: 'GPT-5' },
  ],
  xai: [
    { value: 'grok-4-0709', label: 'Grok 4 (Latest)' },
    { value: 'grok-3', label: 'Grok 3' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini (Fast)' },
  ],
};

interface SecretStatus {
  openai: boolean;
  xai: boolean;
}

export const AIConfigCard = () => {
  const { session } = useAuth();
  const { aiConfig, isLoading, updateAIConfig } = useAppSettings();
  
  const [provider, setProvider] = useState<'openai' | 'xai'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [enabled, setEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [secretStatus, setSecretStatus] = useState<SecretStatus>({ openai: false, xai: false });
  const [checkingSecrets, setCheckingSecrets] = useState(true);
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [xaiKey, setXaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showXaiKey, setShowXaiKey] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Sync local state with fetched config
  useEffect(() => {
    if (aiConfig) {
      setProvider(aiConfig.provider);
      setModel(aiConfig.model);
      setEnabled(aiConfig.enabled);
    }
  }, [aiConfig]);

  // Check which API keys are configured
  useEffect(() => {
    const checkSecrets = async () => {
      if (!session) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-secrets', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        
        if (!error && data) {
          setSecretStatus({
            openai: data.openai || false,
            xai: data.xai || false,
          });
        }
      } catch (err) {
        console.error('Failed to check secrets:', err);
      } finally {
        setCheckingSecrets(false);
      }
    };
    
    checkSecrets();
  }, [session]);

  const handleProviderChange = (newProvider: 'openai' | 'xai') => {
    setProvider(newProvider);
    // Reset to first model of new provider
    setModel(PROVIDER_MODELS[newProvider][0].value);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const newConfig: AIConfig = { provider, model, enabled };
    await updateAIConfig(newConfig);
    setIsSaving(false);
  };

  const handleSaveKey = async (keyType: 'openai' | 'xai') => {
    const keyValue = keyType === 'openai' ? openaiKey : xaiKey;
    
    if (!keyValue.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    
    setSavingKey(keyType);
    
    try {
      const { error } = await supabase.functions.invoke('update-ai-secret', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { provider: keyType, apiKey: keyValue },
      });
      
      if (error) throw error;
      
      toast.success(`${keyType === 'openai' ? 'OpenAI' : 'xAI'} API key updated`);
      setSecretStatus(prev => ({ ...prev, [keyType]: true }));
      
      // Clear the input
      if (keyType === 'openai') {
        setOpenaiKey('');
        setShowOpenaiKey(false);
      } else {
        setXaiKey('');
        setShowXaiKey(false);
      }
    } catch (err) {
      console.error('Failed to save API key:', err);
      toast.error('Failed to save API key');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Configuration
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
          <Sparkles className="h-5 w-5" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure AI provider and model for the chat assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable AI */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable AI Features</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to use AI assistant
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <Separator />

        {/* Provider Selection */}
        <div className="space-y-3">
          <Label>AI Provider</Label>
          <RadioGroup
            value={provider}
            onValueChange={(v) => handleProviderChange(v as 'openai' | 'xai')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="openai" id="openai" />
              <Label htmlFor="openai" className="cursor-pointer">OpenAI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="xai" id="xai" />
              <Label htmlFor="xai" className="cursor-pointer">xAI (Grok)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="aiModel">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="aiModel">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_MODELS[provider].map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Saving...' : 'Save AI Settings'}
        </Button>

        <Separator />

        {/* API Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <Label className="text-base font-medium">API Keys</Label>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>OpenAI API Key</Label>
              <span className={`flex items-center gap-1 text-xs ${secretStatus.openai ? 'text-green-500' : 'text-muted-foreground'}`}>
                {checkingSecrets ? (
                  'Checking...'
                ) : secretStatus.openai ? (
                  <><Check className="h-3 w-3" /> Configured</>
                ) : (
                  <><X className="h-3 w-3" /> Not Set</>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showOpenaiKey ? 'text' : 'password'}
                  placeholder={secretStatus.openai ? '••••••••••••••••' : 'Enter OpenAI API key...'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => handleSaveKey('openai')}
                disabled={savingKey === 'openai' || !openaiKey.trim()}
              >
                {savingKey === 'openai' ? 'Saving...' : secretStatus.openai ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>

          {/* xAI Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>xAI API Key</Label>
              <span className={`flex items-center gap-1 text-xs ${secretStatus.xai ? 'text-green-500' : 'text-muted-foreground'}`}>
                {checkingSecrets ? (
                  'Checking...'
                ) : secretStatus.xai ? (
                  <><Check className="h-3 w-3" /> Configured</>
                ) : (
                  <><X className="h-3 w-3" /> Not Set</>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showXaiKey ? 'text' : 'password'}
                  placeholder={secretStatus.xai ? '••••••••••••••••' : 'Enter xAI API key...'}
                  value={xaiKey}
                  onChange={(e) => setXaiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowXaiKey(!showXaiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showXaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => handleSaveKey('xai')}
                disabled={savingKey === 'xai' || !xaiKey.trim()}
              >
                {savingKey === 'xai' ? 'Saving...' : secretStatus.xai ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            API keys are encrypted and stored securely. They are never exposed to the frontend.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
