import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { NoteCard } from "@/components/note-card";
import { useApp } from "@/lib/app-context";
import { Note } from "@/lib/types";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function NotesScreen() {
  const router = useRouter();
  const { state, deleteNote } = useApp();
  const { notes, isLoading } = state;
  const colors = useColors();
  const [showArchived, setShowArchived] = useState(false);

  const handleManageFolders = () => {
    router.push("/folders");
  };

  const filteredNotes = notes.filter((note) => {
    if (showArchived) return note.isArchived;
    return !note.isArchived;
  });

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleAddNote = () => {
    router.push("/note/new");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Loading notes...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Notes</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleManageFolders}
            className="bg-surface border border-border rounded-full w-12 h-12 items-center justify-center"
          >
            <Ionicons name="folder-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddNote}
            className="bg-primary rounded-full w-12 h-12 items-center justify-center"
          >
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View className="mb-4 flex-row gap-2">
        <TouchableOpacity
          onPress={() => setShowArchived(false)}
          className={`flex-1 px-3 py-2 rounded-full ${
            !showArchived ? "bg-primary" : "bg-surface border border-border"
          }`}
        >
          <Text
            className={`text-sm font-medium text-center ${
              !showArchived ? "text-white" : "text-foreground"
            }`}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowArchived(true)}
          className={`flex-1 px-3 py-2 rounded-full ${
            showArchived ? "bg-primary" : "bg-surface border border-border"
          }`}
        >
          <Text
            className={`text-sm font-medium text-center ${
              showArchived ? "text-white" : "text-foreground"
            }`}
          >
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item.id)}
            />
          )}
          scrollEnabled={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-2xl mb-2">📝</Text>
          <Text className="text-lg font-semibold text-foreground">
            {showArchived ? "No archived notes" : "No notes yet"}
          </Text>
          <Text className="text-sm text-muted mt-2">
            {showArchived ? "Archive notes to see them here" : "Create a note to get started"}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
