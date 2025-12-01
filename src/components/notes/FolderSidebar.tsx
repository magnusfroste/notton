import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  LogOut,
  Folder,
  MoreHorizontal,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Folder as FolderType } from "@/pages/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDroppable } from "@dnd-kit/core";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Clock,
  User,
  Briefcase,
  Lightbulb,
  Trash2,
  Folder,
};

interface FolderSidebarProps {
  folders: FolderType[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateFolder: (name: string, icon?: string) => Promise<any>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
  onOpenFolderAI?: (folderId: string) => void;
}

interface DroppableFolderProps {
  folder: FolderType;
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  isCollapsed: boolean;
  onOpenFolderAI?: (folderId: string) => void;
  onDeleteFolder?: (id: string) => Promise<boolean>;
  isUserFolder?: boolean;
}

function DroppableFolder({
  folder,
  selectedFolder,
  onSelectFolder,
  isCollapsed,
  onOpenFolderAI,
  onDeleteFolder,
  isUserFolder,
}: DroppableFolderProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folderId: folder.id === "all" ? null : folder.id },
  });

  const Icon = iconMap[folder.icon] || (isUserFolder ? Folder : FileText);

  if (isUserFolder) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
          isOver && "bg-primary/20 ring-2 ring-primary/50",
          selectedFolder === folder.id
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <button
          onClick={() => onSelectFolder(folder.id)}
          className="flex-1 flex items-center gap-3"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{folder.name}</span>
              <span className="text-xs text-sidebar-foreground/40">{folder.count}</span>
            </>
          )}
        </button>
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {onOpenFolderAI && folder.count > 0 && (
                <DropdownMenuItem onClick={() => onOpenFolderAI(folder.id)}>
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-[hsl(var(--ai-accent))]" />
                  AI Assistant
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteFolder?.(folder.id)}
              >
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <button
      ref={setNodeRef}
      onClick={() => onSelectFolder(folder.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        isOver && folder.id !== "trash" && "bg-primary/20 ring-2 ring-primary/50",
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
}

export function FolderSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  isCollapsed,
  onToggleCollapse,
  onCreateFolder,
  onDeleteFolder,
  onSignOut,
  onOpenFolderAI,
}: FolderSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const systemFolders = folders.filter((f) => f.isSystem && f.id !== "trash");
  const userFolders = folders.filter((f) => !f.isSystem);
  const trashFolder = folders.find((f) => f.id === "trash");

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreateOpen(false);
    }
  };

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
        {systemFolders.map((folder) => (
          <DroppableFolder
            key={folder.id}
            folder={folder}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            isCollapsed={isCollapsed}
          />
        ))}
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
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {userFolders.map((folder) => (
          <DroppableFolder
            key={folder.id}
            folder={folder}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            isCollapsed={isCollapsed}
            onOpenFolderAI={onOpenFolderAI}
            onDeleteFolder={onDeleteFolder}
            isUserFolder
          />
        ))}
      </div>

      {/* Footer - Trash, Profile, Theme Toggle & Sign Out */}
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
        
        {/* Profile Link */}
        <button
          onClick={() => navigate('/profile')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          {isCollapsed ? (
            <UserCircle className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <Avatar className="h-5 w-5">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(profile?.display_name || null, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left truncate">
                {profile?.display_name || user?.email?.split('@')[0] || 'Profile'}
              </span>
            </>
          )}
        </button>

        <ThemeToggle collapsed={isCollapsed} />
        <button
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
            "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}