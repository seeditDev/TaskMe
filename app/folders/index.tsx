import { useRouter, Stack } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { Folder, Note } from "@/lib/types";
import { useState, useEffect } from "react";
import { folderStorage } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function FoldersScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { notes } = state;
  const colors = useColors();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const loadedFolders = await folderStorage.getAllFolders();
    setFolders(loadedFolders);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const now = Date.now();
    const newFolder: Folder = {
      id: `folder-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    await folderStorage.saveFolder(newFolder);
    setFolders([...folders, newFolder]);
    setNewFolderName("");
    setShowAddFolder(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editName.trim()) return;

    const updatedFolder = { ...editingFolder, name: editName.trim(), updatedAt: Date.now() };
    await folderStorage.saveFolder(updatedFolder);
    setFolders(folders.map((f: Folder) => (f.id === updatedFolder.id ? updatedFolder : f)));
    setEditingFolder(null);
    setEditName("");
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Check if folder has notes
    const notesInFolder = notes.filter((n: Note) => n.folderId === folderId);

    if (notesInFolder.length > 0) {
      Alert.alert(
        "Folder Not Empty",
        `This folder contains ${notesInFolder.length} note(s). Are you sure you want to delete it? The notes will become uncategorized.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await folderStorage.deleteFolder(folderId);
              setFolders(folders.filter((f: Folder) => f.id !== folderId));
            },
          },
        ]
      );
    } else {
      await folderStorage.deleteFolder(folderId);
      setFolders(folders.filter((f: Folder) => f.id !== folderId));
    }
  };

  const getNoteCount = (folderId: string) => {
    return notes.filter((n: Note) => n.folderId === folderId).length;
  };

  const startEditing = (folder: Folder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
  };

  const cancelEditing = () => {
    setEditingFolder(null);
    setEditName("");
  };

  const renderFolder = ({ item: folder }: { item: Folder }) => {
    const isEditing = editingFolder?.id === folder.id;
    const noteCount = getNoteCount(folder.id);

    return (
      <View className="bg-surface rounded-lg border border-border mb-3 overflow-hidden">
        {isEditing ? (
          <View className="p-4">
            <Text className="text-sm text-muted mb-2">Folder Name</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter folder name..."
                placeholderTextColor="#687076"
                autoFocus
                className="flex-1 bg-background rounded-lg p-3 text-foreground text-base border border-border"
              />
              <TouchableOpacity
                onPress={handleUpdateFolder}
                disabled={!editName.trim()}
                className={`px-4 py-3 rounded-lg ${
                  editName.trim() ? "bg-primary" : "bg-primary/50"
                }`}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelEditing}
                className="px-4 py-3 rounded-lg bg-muted/20"
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.push(`/notes?folderId=${folder.id}`)}
              className="flex-row items-center flex-1"
            >
              <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
                <Ionicons name="folder" size={20} color={colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-foreground font-medium">{folder.name}</Text>
                <Text className="text-muted text-sm">{noteCount} note{noteCount !== 1 ? "s" : ""}</Text>
              </View>
            </TouchableOpacity>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => startEditing(folder)}
                className="p-2 mr-1"
              >
                <Ionicons name="pencil-outline" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteFolder(folder.id)}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="p-0">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Manage Folders",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView className="p-4">
        {/* Add Folder Section */}
        <View className="mb-4 bg-surface rounded-lg border border-border overflow-hidden">
          <TouchableOpacity
            onPress={() => setShowAddFolder(!showAddFolder)}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium ml-2">Create New Folder</Text>
            </View>
            <Ionicons
              name={showAddFolder ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>

          {showAddFolder && (
            <View className="p-4 pt-0 border-t border-border">
              <Text className="text-sm text-muted mb-2 mt-4">Folder Name</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Enter folder name..."
                  placeholderTextColor="#687076"
                  autoFocus
                  className="flex-1 bg-background rounded-lg p-3 text-foreground text-base border border-border"
                />
                <TouchableOpacity
                  onPress={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className={`px-4 py-3 rounded-lg ${
                    newFolderName.trim() ? "bg-primary" : "bg-primary/50"
                  }`}
                >
                  <Text className="text-white font-medium">Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Folders List */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-3">
            {folders.length} folder{folders.length !== 1 ? "s" : ""}
          </Text>

          {folders.length > 0 ? (
            <FlatList
              data={folders}
              renderItem={renderFolder}
              keyExtractor={(item: Folder) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="bg-surface rounded-lg border border-border p-8 items-center">
              <Ionicons name="folder-open-outline" size={48} color={colors.muted} />
              <Text className="text-muted text-center mt-4">No folders yet</Text>
              <Text className="text-muted text-sm text-center mt-1">
                Create folders to organize your notes
              </Text>
            </View>
          )}
        </View>

        {/* Uncategorized Notes */}
        <View className="bg-surface rounded-lg border border-border p-4">
          <TouchableOpacity
            onPress={() => router.push("/notes")}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-muted/20 items-center justify-center">
                <Ionicons name="documents-outline" size={20} color={colors.muted} />
              </View>
              <View className="ml-3">
                <Text className="text-foreground font-medium">Uncategorized Notes</Text>
                <Text className="text-muted text-sm">
                  {notes.filter((n: Note) => !n.folderId).length} note
                  {notes.filter((n: Note) => !n.folderId).length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
