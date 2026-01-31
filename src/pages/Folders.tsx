import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Project, Folder } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  FolderTree,
  Folder as FolderIcon,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Users
} from "lucide-react";

export default function Folders() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    parent_folder_id: undefined as number | undefined
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  const { data: folders, isLoading: loadingFolders } = useQuery({
    queryKey: ['folders', selectedProject],
    queryFn: () => selectedProject ? api.getFolders(selectedProject) : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedProject) throw new Error("No project selected");
      return api.createFolder(selectedProject, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedProject] });
      setIsCreateOpen(false);
      setFormData({ name: "", parent_folder_id: undefined });
      toast.success("Folder created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; parent_folder_id?: number } }) =>
      api.updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedProject] });
      setIsEditOpen(false);
      setEditingFolder(null);
      toast.success("Folder updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', selectedProject] });
      toast.success("Folder deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    createMutation.mutate();
  };

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      parent_folder_id: folder.parent_folder_id
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingFolder) return;
    updateMutation.mutate({ id: editingFolder.id, data: formData });
  };

  const handleDelete = (folder: Folder) => {
    if (confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      deleteMutation.mutate(folder.id);
    }
  };

  // Build folder tree structure
  const buildTree = (folders: Folder[], parentId?: number): Folder[] => {
    return folders
      .filter(f => f.parent_folder_id === parentId)
      .map(f => ({
        ...f,
        children: buildTree(folders, f.id)
      }));
  };

  const renderFolderTree = (folder: Folder & { children?: Folder[] }, level = 0) => (
    <div key={folder.id} style={{ marginLeft: level * 24 }}>
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group">
        <div className="flex items-center gap-2">
          {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <FolderIcon className="h-5 w-5 text-blue-500" />
          <span className="font-medium">{folder.name}</span>
          <span className="text-sm text-muted-foreground">
            ({folder.providers_count} providers)
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(folder)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(folder)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {folder.children?.map(child => renderFolderTree(child, level + 1))}
    </div>
  );

  const rootFolders = folders ? buildTree(folders) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Folders</h1>
          <p className="text-muted-foreground mt-1">
            Organize your providers into folders within projects
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Label className="text-base">Select Project:</Label>
            <Select
              value={selectedProject?.toString() || ""}
              onValueChange={(val) => setSelectedProject(parseInt(val))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {loadingProjects ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : projects?.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProject && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Create a folder to organize your providers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Folder Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Folder"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent">Parent Folder (optional)</Label>
                      <Select
                        value={formData.parent_folder_id?.toString() || "none"}
                        onValueChange={(val) => setFormData(prev => ({
                          ...prev,
                          parent_folder_id: val === "none" ? undefined : parseInt(val)
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No parent (root folder)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No parent (root folder)</SelectItem>
                          {folders?.map(folder => (
                            <SelectItem key={folder.id} value={folder.id.toString()}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Folder"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Folder Tree */}
      {selectedProject ? (
        <Card>
          <CardHeader>
            <CardTitle>Folder Structure</CardTitle>
            <CardDescription>
              Organize providers by dragging them into folders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFolders ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rootFolders.length > 0 ? (
              <div className="space-y-1">
                {rootFolders.map(folder => renderFolderTree(folder))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No folders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create folders to organize your providers
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Folder
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a project</h3>
            <p className="text-muted-foreground">
              Choose a project to view and manage its folders
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Folder Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Folder</Label>
              <Select
                value={formData.parent_folder_id?.toString() || "none"}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev,
                  parent_folder_id: val === "none" ? undefined : parseInt(val)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (root folder)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root folder)</SelectItem>
                  {folders?.filter(f => f.id !== editingFolder?.id).map(folder => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
