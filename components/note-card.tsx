import { View, Text, Pressable } from "react-native";
import { Note } from "@/lib/types";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const preview = note.content.substring(0, 80).replace(/\n/g, " ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
    >
      <View className="gap-2">
        {/* Header with pin indicator */}
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground flex-1">{note.title}</Text>
          {note.isPinned && <Text className="text-lg">📌</Text>}
        </View>

        {/* Preview */}
        <Text className="text-sm text-muted line-clamp-2">{preview}</Text>

        {/* Footer with date and tags */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs text-muted">{formatDate(note.updatedAt)}</Text>
          {note.tags && note.tags.length > 0 && (
            <View className="flex-row gap-1">
              {note.tags.slice(0, 2).map((tag) => (
                <View key={tag} className="bg-primary/10 px-2 py-1 rounded">
                  <Text className="text-xs text-primary">#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
