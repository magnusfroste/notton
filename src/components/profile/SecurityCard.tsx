import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SecurityCard() {
  const { isEncryptionEnabled, setupEncryption } = useEncryption();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableEncryption = async () => {
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await setupEncryption(password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Encryption setup failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Encryption enabled',
        description: 'Your notes are now end-to-end encrypted.',
      });
      setPassword('');
      setConfirmPassword('');
    }
  };

  if (isEncryptionEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>End-to-End Encryption</CardTitle>
          </div>
          <CardDescription>Your notes are secured with Apple-grade privacy</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-primary/10 border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Encryption is active.</strong> Your notes are encrypted on your device before
              they reach our servers. We cannot read your data, even if we wanted to.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>End-to-End Encryption</CardTitle>
        </div>
        <CardDescription>
          Enable encryption to ensure only you can read your notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> If you forget your encryption password, your notes cannot
            be recovered. Make sure to use a strong password you'll remember.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encryption-password">Create Encryption Password</Label>
            <Input
              id="encryption-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password (12+ characters)"
            />
            <p className="text-xs text-muted-foreground">
              Use uppercase, lowercase, numbers, and special characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleEnableEncryption}
              disabled={!password || !confirmPassword || isLoading}
              className="w-full"
            >
              {isLoading ? 'Enabling Encryption...' : 'Enable End-to-End Encryption'}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Why enable encryption?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your notes stay private, even from us</li>
            <li>• Apple-grade security using AES-256-GCM</li>
            <li>• Protection against server breaches</li>
            <li>• No one can access your data without your password</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
