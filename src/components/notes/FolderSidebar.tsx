import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  User,
  Briefcase,
  Lightbulb,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Folder } from "@/pages/Dashboard";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Clock,
  User,
  Briefcase,
  Lightbulb,
  Trash2,
};

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function FolderSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  isCollapsed,
  onToggleCollapse,
}: FolderSidebarProps) {
  const systemFolders = folders.filter((f) => f.isSystem && f.id !== "trash");
  const userFolders = folders.filter((f) => !f.isSystem);
  const trashFolder = folders.find((f) => f.id === "trash");

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 h-14">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground/80 uppercase tracking-wider">
            Folders
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* System Folders */}
      <div className="px-2 space-y-0.5">
        {systemFolders.map((folder) => {
          const Icon = iconMap[folder.icon] || FileText;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                selectedFolder === folder.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-sidebar-foreground/40">{folder.count}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      {!isCollapsed && (
        <div className="my-3 mx-3 border-t border-sidebar-border" />
      )}

      {/* User Folders */}
      <div className="flex-1 px-2 space-y-0.5 tahoe-scrollbar overflow-y-auto">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              My Folders
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {userFolders.map((folder) => {
          const Icon = iconMap[folder.icon] || FileText;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                selectedFolder === folder.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-sidebar-foreground/40">{folder.count}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer - Trash & Settings */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        {trashFolder && (
          <button
            onClick={() => onSelectFolder(trashFolder.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              selectedFolder === trashFolder.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">{trashFolder.name}</span>
                <span className="text-xs text-sidebar-foreground/40">{trashFolder.count}</span>
              </>
            )}
          </button>
        )}
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
            "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left truncate">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
