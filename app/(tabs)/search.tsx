import { Text, View, TouchableOpacity, FlatList, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { search, SearchFilters, SearchResult } from "@/lib/search";
import { useState, useMemo } from "react";
import { TaskCard } from "@/components/task-card";
import { NoteCard } from "@/components/note-card";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { formatDate } from "@/lib/date-utils";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function SearchScreen() {
  const { state } = useApp();
  const { tasks, notes, isLoading } = state;
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "task" | "note">("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() && !dateFrom && !dateTo) return [];

    const filters: SearchFilters = {
      query: query.trim(),
      type: searchType as "task" | "note" | "all",
      dateFrom: dateFrom ? dateFrom.getTime() : undefined,
      dateTo: dateTo ? dateTo.getTime() : undefined,
    };

    return search(tasks, notes, filters);
  }, [query, searchType, tasks, notes, dateFrom, dateTo]);

  const renderResult = (result: SearchResult) => {
    if (result.type === "task") {
      const task = tasks.find((t) => t.id === result.id);
      if (!task) return null;
      return <TaskCard key={result.id} task={task} />;
    } else {
      const note = notes.find((n) => n.id === result.id);
      if (!note) return null;
      return <NoteCard key={result.id} note={note} />;
    }
  };

  const handleDateFromChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDateFromPicker(false);
    if (selectedDate) {
      setDateFrom(selectedDate);
    }
  };

  const handleDateToChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDateToPicker(false);
    if (selectedDate) {
      setDateTo(selectedDate);
    }
  };

  const clearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setQuery("");
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <Text className="text-2xl font-bold text-foreground mb-4">Search</Text>

      {/* Search Input */}
      <View className="mb-4 bg-surface rounded-lg border border-border px-3 py-2 flex-row items-center">
        <Text className="text-lg text-muted mr-2">🔍</Text>
        <TextInput
          placeholder="Search tasks and notes..."
          placeholderTextColor="#687076"
          value={query}
          onChangeText={setQuery}
          className="flex-1 text-foreground"
        />
      </View>

      {/* Type Filter */}
      <View className="mb-4 flex-row gap-2">
        {["all", "task", "note"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSearchType(type as "all" | "task" | "note")}
            className={`px-3 py-2 rounded-full ${
              searchType === type ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                searchType === type ? "text-white" : "text-foreground"
              }`}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters Toggle */}
      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        className="mb-4 flex-row items-center justify-between bg-surface rounded-lg border border-border p-3"
      >
        <View className="flex-row items-center">
          <Ionicons name="options-outline" size={20} color={colors.primary} />
          <Text className="text-foreground font-medium ml-2">Date Filters</Text>
          {(dateFrom || dateTo) && (
            <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-primary text-xs">Active</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showFilters ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.muted}
        />
      </TouchableOpacity>

      {/* Date Filters */}
      {showFilters && (
        <View className="mb-4 bg-surface rounded-lg border border-border p-4">
          <View className="flex-row gap-2 mb-3">
            {/* Date From */}
            <View className="flex-1">
              <Text className="text-sm text-muted mb-2">From</Text>
              <TouchableOpacity
                onPress={() => setShowDateFromPicker(true)}
                className="bg-background rounded-lg p-3 border border-border flex-row items-center justify-between"
              >
                <Text className={dateFrom ? "text-foreground" : "text-muted"}>
                  {dateFrom ? formatDate(dateFrom.getTime()) : "Select date..."}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              {showDateFromPicker && (
                <DateTimePicker
                  value={dateFrom || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateFromChange}
                />
              )}
            </View>

            {/* Date To */}
            <View className="flex-1">
              <Text className="text-sm text-muted mb-2">To</Text>
              <TouchableOpacity
                onPress={() => setShowDateToPicker(true)}
                className="bg-background rounded-lg p-3 border border-border flex-row items-center justify-between"
              >
                <Text className={dateTo ? "text-foreground" : "text-muted"}>
                  {dateTo ? formatDate(dateTo.getTime()) : "Select date..."}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              {showDateToPicker && (
                <DateTimePicker
                  value={dateTo || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateToChange}
                />
              )}
            </View>
          </View>

          {/* Clear Filters */}
          {(dateFrom || dateTo || query) && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center justify-center py-2"
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text className="text-error ml-2 text-sm font-medium">Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results */}
      {query.trim() ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderResult(item)}
            scrollEnabled={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-2xl mb-2">🔍</Text>
            <Text className="text-lg font-semibold text-foreground">No results found</Text>
            <Text className="text-sm text-muted mt-2">Try a different search term</Text>
          </View>
        )
      ) : (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-2xl mb-2">🔍</Text>
          <Text className="text-lg font-semibold text-foreground">Start searching</Text>
          <Text className="text-sm text-muted mt-2">Search across all your tasks and notes</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
