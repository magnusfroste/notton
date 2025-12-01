import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Application Settings */}
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
                  defaultValue="Tahoe Notes"
                  placeholder="Enter application name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTheme">Default Theme</Label>
                <Select defaultValue="dark">
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
                <Switch defaultChecked />
              </div>

              <Button className="w-full sm:w-auto" disabled>
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI assistant settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="aiModel">Default AI Model</Label>
                <Select defaultValue="gpt-4o-mini">
                  <SelectTrigger id="aiModel">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                    <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="gpt-5">GPT-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to use AI assistant
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="w-full sm:w-auto" disabled>
                Save AI Settings
              </Button>
            </CardContent>
          </Card>

          {/* Plans & Pricing (Future) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plans & Pricing
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
              </CardTitle>
              <CardDescription>
                Configure subscription plans and pricing tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan configuration will be available in a future update.
              </p>
            </CardContent>
          </Card>

          {/* User Management (Future) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
              </CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                User management features will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
