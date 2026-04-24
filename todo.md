# Offline Productivity App - Development TODO

## Core Features

### Dashboard / Home Screen
- [x] Design and implement dashboard layout
- [x] Display today's tasks
- [x] Display upcoming tasks
- [x] Show completed tasks summary
- [x] Add quick action buttons (Add Task, Add Note)

### Task Management
- [x] Create task list view with filtering
- [x] Add task priority indicators (Low, Medium, High)
- [x] Implement task status tracking (Pending, In Progress, Completed)
- [x] Implement task completion with checkbox
- [ ] Create task creation screen
- [ ] Implement task editing
- [ ] Implement task deletion
- [ ] Add subtask support

### Notes Management
- [x] Create notes list view
- [x] Implement archive/unarchive functionality
- [x] Add tag support for notes
- [x] Implement pin/unpin functionality
- [ ] Create note creation screen
- [ ] Implement note editing
- [ ] Implement note deletion
- [ ] Implement folder/category organization
- [ ] Add rich text editor support

### Local Data Storage
- [x] Set up AsyncStorage for preferences and settings
- [x] Implement CRUD operations for all entities
- [x] Add data validation
- [ ] Implement SQLite database layer (expo-sqlite)
- [ ] Create database schema for tasks
- [ ] Create database schema for notes
- [ ] Create database schema for reminders
- [ ] Create database schema for tags
- [ ] Create database schema for folders

### Reminders & Notifications
- [x] Implement reminder scheduling using expo-notifications
- [x] Implement reminder recurrence (daily, weekly, monthly, yearly)
- [ ] Create local notification display
- [ ] Implement alarm screen (full-screen activity)
- [ ] Add snooze functionality
- [ ] Add dismiss functionality
- [ ] Handle reminders when app is killed
- [ ] Add alarm sound playback

### Voice Features
- [x] Implement Text-to-Speech (TTS) using expo-speech
- [ ] Add voice input for task creation
- [ ] Add voice input for note creation
- [ ] Implement speech-to-text using expo-speech-recognition
- [ ] Add voice reminder playback
- [ ] Handle offline language packs

### Search & Filtering
- [x] Implement global search across tasks and notes
- [x] Add keyword-based search
- [x] Add tag-based filtering
- [x] Add priority filtering
- [x] Add status filtering
- [x] Implement real-time search results
- [ ] Add date range filtering

### Settings
- [x] Create settings screen
- [x] Implement notification preferences
- [x] Implement voice settings
- [x] Implement theme selection (light/dark mode)
- [x] Implement reminder defaults
- [ ] Add backup/export functionality
- [ ] Add restore/import functionality

### Attachments
- [ ] Implement image attachment support
- [ ] Implement file attachment support
- [ ] Implement link attachment support
- [ ] Add file picker integration
- [ ] Add image picker integration
- [ ] Store attachments locally

### UI Components
- [x] Create task card component
- [x] Create note card component
- [ ] Create reusable button components
- [ ] Create reminder card component
- [ ] Create date/time picker component
- [ ] Create priority selector component
- [ ] Create tag input component
- [ ] Create search bar component

### Navigation
- [x] Set up tab-based navigation (Dashboard, Tasks, Notes, Search, Settings)
- [ ] Implement screen transitions
- [ ] Add navigation headers
- [ ] Implement back navigation

### Testing & Polish
- [ ] Test all user flows end-to-end
- [ ] Test reminder triggering
- [ ] Test voice features
- [ ] Test search functionality
- [ ] Verify offline functionality
- [ ] Test on multiple device sizes
- [ ] Performance optimization
- [ ] Battery optimization

## Advanced Features (Future)
- [ ] Smart suggestions based on user behavior
- [ ] Productivity analytics
- [ ] Habit tracking
- [ ] AI note summarization
- [ ] Auto task detection from notes
- [ ] Cloud sync (Firebase - optional)
- [ ] Multi-device support

## Known Issues
- (None yet)

## Completed Features
- [x] Core data layer with AsyncStorage
- [x] App context and state management
- [x] Home/Dashboard screen
- [x] Tasks screen with filtering
- [x] Notes screen with archive view
- [x] Search screen
- [x] Settings screen
- [x] Task and Note card components
- [x] Notification service
- [x] Reminder manager with scheduling
- [x] Voice service (TTS)
- [x] Tab-based navigation
