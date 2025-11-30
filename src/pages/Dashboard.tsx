import { useState } from "react";
import { FolderSidebar } from "@/components/notes/FolderSidebar";
import { NotesList } from "@/components/notes/NotesList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIChatPanel } from "@/components/notes/AIChatPanel";

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  count: number;
  isSystem?: boolean;
}

const mockFolders: Folder[] = [
  { id: "all", name: "All Notes", icon: "FileText", count: 12, isSystem: true },
  { id: "recent", name: "Recently Viewed", icon: "Clock", count: 5, isSystem: true },
  { id: "personal", name: "Personal", icon: "User", count: 4 },
  { id: "work", name: "Work", icon: "Briefcase", count: 6 },
  { id: "ideas", name: "Ideas", icon: "Lightbulb", count: 2 },
  { id: "trash", name: "Recently Deleted", icon: "Trash2", count: 1, isSystem: true },
];

const mockNotes: Note[] = [
  {
    id: "1",
    title: "Project Roadmap 2025",
    content: "Planning the next quarter milestones and deliverables...",
    folderId: "work",
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-30"),
  },
  {
    id: "2",
    title: "Meeting Notes - Design Review",
    content: "Discussed the new UI components and design system updates...",
    folderId: "work",
    createdAt: new Date("2024-11-29"),
    updatedAt: new Date("2024-11-29"),
  },
  {
    id: "3",
    title: "Weekend Trip Ideas",
    content: "Looking at destinations for the upcoming long weekend...",
    folderId: "personal",
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-27"),
  },
  {
    id: "4",
    title: "App Feature Brainstorm",
    content: "New ideas for improving user engagement and retention...",
    folderId: "ideas",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-30"),
  },
];

const Dashboard = () => {
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(mockNotes[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const filteredNotes = mockNotes.filter((note) => {
    const matchesFolder = selectedFolder === "all" || note.folderId === selectedFolder;
    const matchesSearch =
      searchQuery === "" ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="flex h-screen w-full bg-background dark">
      {/* Left Sidebar - Folders */}
      <FolderSidebar
        folders={mockFolders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Center Column - Notes List */}
      <NotesList
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Right Column - Note Editor */}
      <NoteEditor
        note={selectedNote}
        onOpenAIPanel={() => setIsAIPanelOpen(true)}
      />

      {/* AI Chat Panel - Slide-out */}
      <AIChatPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        note={selectedNote}
      />
    </div>
  );
};

export default Dashboard;
