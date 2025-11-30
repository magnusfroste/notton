import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FileText className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Tahoe Notes</h1>
        </div>
        
        <p className="text-lg text-muted-foreground mb-2">
          Simple notes with AI superpowers.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 mb-8">
          <Sparkles className="h-4 w-4 text-[hsl(var(--ai-accent))]" />
          <span>Powered by AI</span>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate("/auth")}
          className="w-full max-w-xs"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
