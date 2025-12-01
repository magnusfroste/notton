import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, FolderOpen, Search, Trash2, Type, Sun, Moon, Wand2, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import heroIllustration from "@/assets/hero-illustration.png";

const features = [
  {
    icon: Type,
    title: "Rich Text Editing",
    description: "Format notes with headers, bold, lists, checklists, and more."
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Keep your content organized with custom folders."
  },
  {
    icon: Search,
    title: "AI-Powered Search",
    description: "Find anything instantly with semantic search."
  },
  {
    icon: Wand2,
    title: "AI Magic",
    description: "Consolidate 25 CVs into a master document in 15 seconds."
  },
  {
    icon: MessageSquare,
    title: "Chat & Listen",
    description: "Talk to your notes. Ask questions. Get answers."
  },
  {
    icon: Trash2,
    title: "Never Lose Anything",
    description: "Restore deleted content with ease."
  }
];

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
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 py-12">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[hsl(var(--ai-accent))]/15">
            <Sparkles className="h-10 w-10 text-[hsl(var(--ai-accent))]" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Notton AI</h1>
        </div>
        
        <p className="text-xl text-foreground font-medium mb-2">
          Pure magic for your productivity.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/80 mb-8">
          <span>✨ The new kid on the block</span>
        </div>

        <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
          <img 
            src={heroIllustration} 
            alt="Notton AI - AI-powered productivity illustration" 
            className="w-full h-auto"
          />
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate("/auth")}
          className="w-full max-w-xs mb-16"
        >
          Get Started
        </Button>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-8">Superpowers Included</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border"
            >
              <div className="p-3 rounded-lg bg-[hsl(var(--ai-accent))]/10 mb-4">
                <feature.icon className="h-6 w-6 text-[hsl(var(--ai-accent))]" />
              </div>
              <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground/60">
        <a href="https://notton.app" className="hover:text-foreground transition-colors">
          notton.app
        </a>
      </footer>
    </div>
  );
};

export default Index;
