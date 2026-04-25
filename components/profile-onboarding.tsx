import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useApp } from "@/lib/app-context";
import { ScreenContainer } from "./screen-container";
import { Ionicons } from "@expo/vector-icons";

export function ProfileOnboarding() {
  const { state, updateSettings } = useApp();
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = async () => {
    if (!name || !dob || !phone || !email) {
      Alert.alert("Required Fields", "Please fill in all details to continue.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const userProfile = {
      name,
      dob: dob.toISOString().split('T')[0], // Format as YYYY-MM-DD
      phoneNumber: phone,
      email,
      isCompleted: true,
    };

    if (state.settings) {
      await updateSettings({
        ...state.settings,
        userProfile,
      });
    }
  };

  return (
    <ScreenContainer className="p-0">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="items-center mt-10 mb-8">
            <View className="bg-primary/10 p-4 rounded-full mb-4">
              <Ionicons name="person-add-outline" size={60} color="#4caf50" />
            </View>
            <Text className="text-3xl font-bold text-foreground text-center">Welcome to TaskMe!</Text>
            <Text className="text-muted text-center mt-2">Let's set up your profile to get started.</Text>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1 ml-1">Full Name</Text>
              <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#888" className="mr-2" />
                <TextInput
                  className="flex-1 text-foreground ml-2"
                  placeholder="Enter your name"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1 ml-1">Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowDobPicker(true)}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center"
              >
                <Ionicons name="calendar-outline" size={20} color="#888" style={{ marginRight: 8 }} />
                <Text className="flex-1 text-foreground ml-2">
                  {dob ? dob.toDateString() : "Select date"}
                </Text>
              </TouchableOpacity>
              {showDobPicker && (
                <View style={Platform.OS === 'android' ? { position: 'absolute', top: 50, left: 0, right: 0, zIndex: 1000 } : {}}>
                  <DateTimePicker
                    value={dob || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      if (Platform.OS === 'android') {
                        setShowDobPicker(false);
                      }
                      if (selectedDate) {
                        setDob(selectedDate);
                      }
                      if (Platform.OS === 'ios') {
                        setShowDobPicker(false);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                </View>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1 ml-1">Phone Number</Text>
              <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#888" className="mr-2" />
                <TextInput
                  className="flex-1 text-foreground ml-2"
                  placeholder="Enter phone number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1 ml-1">Email ID</Text>
              <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#888" className="mr-2" />
                <TextInput
                  className="flex-1 text-foreground ml-2"
                  placeholder="Enter email address"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-xl py-4 mt-10 items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Complete Setup</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
