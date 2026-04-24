import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useApp } from "@/lib/app-context";
import { ScreenContainer } from "./screen-container";
import { Ionicons } from "@expo/vector-icons";

export function ProfileOnboarding() {
  const { state, updateSettings } = useApp();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
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
      dob,
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
              <View className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#888" className="mr-2" />
                <TextInput
                  className="flex-1 text-foreground ml-2"
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#888"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
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
