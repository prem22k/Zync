import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/utils";
import { 
  Home, 
  FolderKanban, 
  MessageSquare,
  FileText, 
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Plus,
  ArrowLeft,
  Bell,
  Search,
  Settings,
  Github,
  Video,
  Clock,
  CheckSquare,
  FolderOpen,
  Star
} from "lucide-react";
import { NotesView } from "@/components/notes/NotesView";
import Workspace from "@/components/workspace/Workspace";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { collection, query, where, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import ChatView from "./ChatView";
import SettingsView from "./SettingsView";
import DesignView from "./DesignView";
import MyProjectsView from "./MyProjectsView";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MobileView = () => {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("zync-active-section") || "Dashboard";
  });
  
  useEffect(() => {
    localStorage.setItem("zync-active-section", activeSection);
  }, [activeSection]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync active section with URL path for /dashboard/projects
  useEffect(() => {
    if (location.pathname === '/dashboard/projects') {
      setActiveSection("My Projects");
    }
  }, [location.pathname]);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, any>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
     if (activeSection === "Chat" || activeSection === "Notes") {
      const fetchUsers = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users`);
          if (response.ok) {
            const data = await response.json();
            setUsersList(data);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
     }
  }, [activeSection]);


  // New Project State
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectDescription) {
      toast({
        title: "Missing fields",
        description: "Please fill in both project name and description.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
        const user = auth.currentUser;
        const ownerId = user ? user.uid : "anonymous";
        const response = await fetch(`${API_BASE_URL}/api/projects/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName, description: projectDescription, ownerId }),
        });
        if (!response.ok) throw new Error("Failed to generate project");
        const data = await response.json();
        toast({ title: "Project Created!", description: "AI has generated your project architecture." });
        navigate(`/projects/${data._id}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };


  const bottomNavItems = [
    { icon: Home, label: "Dashboard", section: "Dashboard" },
    { icon: FolderKanban, label: "Projects", section: "My Projects" },
    { icon: MessageSquare, label: "Chat", section: "Chat" },
    { icon: FileText, label: "Notes", section: "Notes" },
  ];

  const menuItems = [
    { icon: CheckSquare, label: "Tasks", section: "Tasks" },
    { icon: FolderOpen, label: "Files", section: "Files" },
    { icon: Star, label: "Design", section: "Design" },
    { icon: Clock, label: "Activity log", section: "Activity log" },
    { icon: Video, label: "Meet", section: "Meet" },
    { icon: Settings, label: "Settings", section: "Settings" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "My Workspace":
      case "Dashboard":
         // Simplify workspace for mobile - maybe just a summary or the workspace components stack
         return (
            <div className="p-4 safe-area-bottom h-full overflow-y-auto">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Hello, {currentUser?.displayName?.split(' ')[0] || "User"}</h2>
                        <p className="text-sm text-muted-foreground">Here's your update for today</p>
                    </div>
                     <Avatar>
                        <AvatarImage src={currentUser?.photoURL || undefined} />
                        <AvatarFallback>{currentUser?.displayName?.substring(0,2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                 </div>
                 
                 <Button className="w-full mb-6 py-6 text-lg" onClick={() => setActiveSection("New Project")}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Project
                 </Button>

                 <div className="space-y-4">
                     <Card onClick={() => setActiveSection("My Projects")}>
                         <CardContent className="p-4 flex items-center gap-4">
                             <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                 <FolderKanban className="w-6 h-6" />
                             </div>
                             <div>
                                 <h3 className="font-semibold">My Projects</h3>
                                 <p className="text-xs text-muted-foreground">Manage your ongoing work</p>
                             </div>
                         </CardContent>
                     </Card>
                     
                     <Card onClick={() => setActiveSection("Tasks")}>
                         <CardContent className="p-4 flex items-center gap-4">
                             <div className="p-3 bg-secondary rounded-lg text-secondary-foreground">
                                 <CheckSquare className="w-6 h-6" />
                             </div>
                             <div>
                                 <h3 className="font-semibold">My Tasks</h3>
                                 <p className="text-xs text-muted-foreground">View upcoming deadlines</p>
                             </div>
                         </CardContent>
                     </Card>

                    <Card onClick={() => setActiveSection("Notes")}>
                         <CardContent className="p-4 flex items-center gap-4">
                             <div className="p-3 bg-orange-100 rounded-lg text-orange-600 dark:bg-orange-900/20">
                                 <FileText className="w-6 h-6" />
                             </div>
                             <div>
                                 <h3 className="font-semibold">Notes</h3>
                                 <p className="text-xs text-muted-foreground">Ideas and documentation</p>
                             </div>
                         </CardContent>
                     </Card>
                 </div>
            </div>
         );

      case "My Projects":
         return <MyProjectsView currentUser={currentUser} />;

      case "Chat":
         if (selectedChatUser) {
             return (
                 <div className="flex flex-col h-full">
                     <div className="flex items-center gap-2 p-3 border-b flex-none">
                         <Button variant="ghost" size="icon" onClick={() => setSelectedChatUser(null)}>
                             <ArrowLeft className="w-5 h-5" />
                         </Button>
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={selectedChatUser.photoURL} />
                            <AvatarFallback>{selectedChatUser.displayName?.substring(0,2) || "U"}</AvatarFallback>
                         </Avatar>
                         <span className="font-medium">{selectedChatUser.displayName}</span>
                     </div>
                     <div className="flex-1 overflow-hidden relative">
                         {/* Pass a dummy container since ChatView expects explicit height often */}
                         <div className="absolute inset-0">
                            <ChatView selectedUser={selectedChatUser} />
                         </div>
                     </div>
                 </div>
             );
         }
         return (
             <div className="p-4 h-full flex flex-col">
                 <h2 className="text-2xl font-bold mb-4">Messages</h2>
                 <Input className="mb-4" placeholder="Search people..." />
                 <div className="space-y-2 overflow-y-auto flex-1 pb-20">
                     {usersList.filter(u => u.uid !== currentUser?.uid).map(user => (
                         <div 
                            key={user.uid} 
                            className="flex items-center gap-3 p-3 bg-card rounded-lg border cursor-pointer hover:bg-accent"
                            onClick={() => setSelectedChatUser(user)}
                         >
                             <Avatar>
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback>{user.displayName?.substring(0,2) || "U"}</AvatarFallback>
                             </Avatar>
                             <div className="flex-1 overflow-hidden">
                                 <h4 className="font-medium truncate">{user.displayName}</h4>
                                 <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         );

      case "Notes":
         return (
            <div className="h-full flex flex-col relative">
                {/* Mobile Notes wrapper usually needs adjustments for height */}
                <div className="absolute inset-0 overflow-hidden">
                    <NotesView 
                        user={currentUser ? { 
                            uid: currentUser.uid, 
                            displayName: currentUser.displayName || undefined, 
                            email: currentUser.email || undefined 
                        } : null} 
                        users={usersList}
                        initialNoteId={activeNoteId}
                    />
                </div>
            </div>
         );

      case "Settings":
         return (
             <div className="h-full overflow-y-auto pb-20">
                <SettingsView />
             </div>
         );
      
      case "Design":
          return <DesignView />;
      
      case "New Project":
          return (
            <div className="p-4 h-full overflow-y-auto pb-20">
                 <div className="mb-6 flex items-center gap-2">
                     <Button variant="ghost" size="icon" onClick={() => setActiveSection("Dashboard")}>
                         <ArrowLeft className="w-5 h-5" />
                     </Button>
                     <h2 className="text-xl font-bold">New Project</h2>
                 </div>
                 
                  <Card className="border-none shadow-none bg-transparent p-0">
                    <CardContent className="p-0">
                      <form onSubmit={handleCreateProject} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Project Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g., E-commerce App"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            disabled={isGenerating}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe your project..."
                            className="min-h-[150px]"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            disabled={isGenerating}
                          />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
                            {isGenerating ? "Generating..." : "Generate Plan"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
            </div>
          );

      default:
         return (
             <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                 <p className="text-muted-foreground">This view is optimized for desktop.</p>
                 <Button variant="link" onClick={() => setActiveSection("Dashboard")}>Go to Dashboard</Button>
             </div>
         );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
          {renderContent()}
      </div>

      {/* Bottom Navigation */}
      {!selectedChatUser && ( // Hide nav in chat detail to maximize space
        <div className="h-16 border-t bg-background/80 backdrop-blur-md flex items-center justify-around px-2 pb-safe flex-none z-50">
            {bottomNavItems.map((item) => (
            <button
                key={item.label}
                onClick={() => {
                    setActiveSection(item.section);
                    if (item.section === "Chat") setSelectedChatUser(null);
                }}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                activeSection === item.section ? "text-primary" : "text-muted-foreground"
                }`}
            >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
            </button>
            ))}
            
            {/* More Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground">
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[20px] max-h-[85vh] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-4 gap-4 py-6">
                        {menuItems.map((item) => (
                            <button 
                                key={item.label}
                                className="flex flex-col items-center gap-2 p-2 hover:bg-secondary/50 rounded-lg"
                                onClick={() => {
                                    setActiveSection(item.section);
                                    // Clicking outside closes it by default behavior
                                }}
                            >
                                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                                    <item.icon className="w-6 h-6 text-foreground" />
                                </div>
                                <span className="text-xs text-center">{item.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="border-t pt-4 mt-2 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Avatar>
                                    <AvatarImage src={currentUser?.photoURL || undefined} />
                                    <AvatarFallback>{currentUser?.displayName?.substring(0,2) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{currentUser?.displayName || "User"}</p>
                                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                        <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={async () => {
                                localStorage.removeItem("zync-active-section");
                                await signOut(auth);
                                navigate("/login");
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      )}
    </div>
  );
};

export default MobileView;
