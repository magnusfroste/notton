import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import { AIConfigCard } from '@/components/admin/AIConfigCard';
import { AppSettingsCard } from '@/components/admin/AppSettingsCard';

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
          <AppSettingsCard />

          {/* AI Configuration */}
          <AIConfigCard />

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
