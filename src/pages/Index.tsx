import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Layers, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();

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
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[hsl(var(--ai-accent))] to-[hsl(var(--ai-accent))]/70 shadow-lg shadow-[hsl(var(--ai-accent))]/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              Notton
            </h1>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              Notes that think with you
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Like Apple Notes, but with an AI sidekick that summarizes, extracts tasks, and merges docs in seconds.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="group px-8 h-12 text-base font-medium"
            >
              Start for free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <span className="text-sm text-muted-foreground">No credit card required</span>
          </div>

          {/* Key Features - Minimal */}
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-lg mx-auto">
            <div className="flex gap-4">
              <div className="shrink-0 p-2 rounded-lg bg-[hsl(var(--ai-accent))]/10">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--ai-accent))]" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Chat with your notes</h3>
                <p className="text-sm text-muted-foreground">Ask questions. Get answers from your own content.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 p-2 rounded-lg bg-[hsl(var(--ai-accent))]/10">
                <Layers className="h-5 w-5 text-[hsl(var(--ai-accent))]" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Consolidate anything</h3>
                <p className="text-sm text-muted-foreground">Merge 25 docs into one master file in 15 seconds.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground/60">
        <a 
          href="https://notton.app" 
          className="hover:text-foreground transition-colors"
        >
          notton.app
        </a>
      </footer>
    </div>
  );
};

export default Index;
