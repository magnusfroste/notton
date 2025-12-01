import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-3 py-2 h-auto text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground justify-start"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      {!collapsed && (
        <span className="flex-1 text-left truncate text-sm">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </Button>
  );
}
