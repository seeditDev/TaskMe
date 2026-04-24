# Offline Productivity App - UI/UX Design Specification

## Design Philosophy

This application follows **Apple Human Interface Guidelines (HIG)** principles to ensure a native iOS-like experience. The design assumes **mobile portrait orientation (9:16)** and **one-handed usage**, with clean typography, intuitive navigation, and consistent visual hierarchy.

## Screen List

The application is structured around the following key screens:

1. **Dashboard / Home** - Overview of today's tasks and upcoming items
2. **Tasks List** - View all tasks with filtering and sorting
3. **Task Detail / Create** - Create or edit a task with reminders
4. **Notes List** - View all notes with organization
5. **Note Detail / Create** - Create or edit notes with rich text
6. **Search Results** - Unified search across tasks and notes
7. **Settings** - App preferences and configuration
8. **Reminders / Alarms** - Full-screen alarm display when reminder triggers

## Primary Content and Functionality

### 1. Dashboard / Home Screen

**Content:**
- Welcome message with current date and time
- "Today's Tasks" section showing 3-5 most urgent tasks
- "Upcoming" section showing next 3-5 tasks beyond today
- "Completed Today" summary (count)
- Quick action buttons: "Add Task" and "Add Note"

**Functionality:**
- Tap task to view details or mark complete
- Swipe left to quick-complete a task
- Tap "Add Task" to navigate to task creation
- Tap "Add Note" to navigate to note creation

**Color Scheme:**
- Background: Clean white (light mode) or dark gray (dark mode)
- Primary Accent: Deep blue (#0a7ea4)
- Task Priority Colors: Red (High), Orange (Medium), Green (Low)
- Completed Task: Light gray with strikethrough

### 2. Tasks List Screen

**Content:**
- Tab/Segment control: "All", "Today", "Upcoming", "Completed"
- Filterable list of tasks with:
  - Task title
  - Due date/time
  - Priority indicator (colored dot)
  - Subtask count (if applicable)
  - Completion checkbox

**Functionality:**
- Tap to open task detail
- Swipe left to quick-complete
- Swipe right to delete
- Long-press to select multiple tasks
- Filter by priority, date range, or status
- Sort by due date, priority, or creation date

### 3. Task Detail / Create Screen

**Content:**
- Title input field
- Description text area
- Due date picker
- Due time picker
- Priority selector (Low / Medium / High)
- Reminder configuration:
  - Reminder time selector
  - Repeat pattern selector (None, Daily, Weekly, Monthly, Custom)
  - Reminder type selector (Notification, Alarm, Voice)
- Subtasks section (add/remove subtasks)
- Tags section
- Attachments section

**Functionality:**
- Save task
- Delete task (with confirmation)
- Add/remove subtasks
- Add/remove tags
- Add/remove attachments
- Set reminders with recurrence
- Voice input for task creation (button to activate)

### 4. Notes List Screen

**Content:**
- Folder/Category selector (dropdown or sidebar)
- Grid or list view toggle
- Notes displayed with:
  - Title
  - Preview of content (first 2 lines)
  - Tags
  - Pin indicator
  - Archive indicator
  - Last modified date

**Functionality:**
- Tap to open note detail
- Swipe left to archive
- Swipe right to delete
- Long-press to select multiple notes
- Filter by folder, tags, or search
- Sort by date, title, or pin status
- Create new folder

### 5. Note Detail / Create Screen

**Content:**
- Title input field
- Rich text editor (support for bold, italic, lists, checkboxes)
- Folder selector
- Tags section (add/remove tags)
- Attachments section (images, files, links)
- Pin button
- Archive button

**Functionality:**
- Save note
- Delete note (with confirmation)
- Add/remove tags
- Add/remove attachments
- Pin/unpin note
- Archive/unarchive note
- Voice input for note creation

### 6. Search Results Screen

**Content:**
- Search input field with clear button
- Tabs: "All", "Tasks", "Notes"
- Results list showing:
  - Item type (Task/Note)
  - Title
  - Matched content snippet
  - Tags
  - Date

**Functionality:**
- Real-time search as user types
- Filter results by type (Tasks/Notes)
- Filter by date range or tags
- Tap result to open detail view

### 7. Settings Screen

**Content:**
- Notification Settings:
  - Enable/disable notifications
  - Sound selection
  - Vibration toggle
  - Notification preview
- Voice Settings:
  - TTS voice selection
  - Speech recognition language
  - Voice input sensitivity
- Theme Settings:
  - Light/Dark mode toggle
  - Color theme selector
- Reminder Defaults:
  - Default reminder time before due date
  - Default repeat pattern
  - Default reminder type
- Backup & Restore:
  - Export data button
  - Import data button
  - Last backup date

**Functionality:**
- Toggle settings on/off
- Select options from dropdowns
- Export/import data locally
- Reset to defaults

### 8. Full-Screen Alarm Display

**Content:**
- Large, bold time display
- Task/reminder title
- Snooze button (5, 10, 15 minutes)
- Dismiss button
- Voice reminder playback controls

**Functionality:**
- Display alarm with high visibility
- Play alarm sound
- Play voice reminder (TTS)
- Snooze for selected duration
- Dismiss alarm

## Key User Flows

### Flow 1: Create a Task with Reminder

1. User taps "Add Task" on Dashboard
2. Task Detail screen opens
3. User enters title and description
4. User sets due date and time
5. User selects priority
6. User configures reminder (time, repeat, type)
7. User taps "Save"
8. App schedules reminder in background
9. Dashboard updates to show new task

### Flow 2: Complete a Task

1. User views task in Tasks List or Dashboard
2. User taps checkbox or swipes left to mark complete
3. Task moves to "Completed" section
4. Reminder is cancelled (if not yet triggered)
5. Task shows completion timestamp

### Flow 3: Create a Note with Tags and Attachments

1. User taps "Add Note" on Dashboard
2. Note Detail screen opens
3. User enters title and content
4. User selects folder
5. User adds tags
6. User adds attachments (images, files, links)
7. User taps "Save"
8. Dashboard updates to show new note

### Flow 4: Search for Tasks and Notes

1. User taps search icon (global or screen-specific)
2. Search input field becomes active
3. User types keyword or tag name
4. Results appear in real-time
5. User can filter by type (Tasks/Notes) or other criteria
6. User taps result to open detail view

### Flow 5: Receive and Handle Reminder

1. Scheduled reminder time arrives
2. App triggers local notification or alarm
3. If alarm type, full-screen activity displays
4. User hears alarm sound and/or voice reminder
5. User can snooze (reschedule for later) or dismiss
6. If dismissed, task remains in "Pending" state
7. If snoozed, reminder reschedules for selected duration

## Color Palette

| Color | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | #0a7ea4 | #0a7ea4 | Buttons, links, accents |
| Background | #ffffff | #151718 | Screen background |
| Surface | #f5f5f5 | #1e2022 | Cards, elevated surfaces |
| Foreground | #11181C | #ECEDEE | Primary text |
| Muted | #687076 | #9BA1A6 | Secondary text |
| Border | #E5E7EB | #334155 | Dividers, borders |
| Success | #22C55E | #4ADE80 | Completed tasks |
| Warning | #F59E0B | #FBBF24 | Medium priority |
| Error | #EF4444 | #F87171 | High priority, delete actions |

## Typography

- **Headings (H1):** 32px, Bold, Foreground color
- **Headings (H2):** 24px, Semibold, Foreground color
- **Headings (H3):** 18px, Semibold, Foreground color
- **Body Text:** 16px, Regular, Foreground color
- **Small Text:** 14px, Regular, Muted color
- **Captions:** 12px, Regular, Muted color

## Spacing and Layout

- **Padding:** 16px (standard), 8px (compact), 24px (generous)
- **Gap between items:** 8px (compact), 12px (standard), 16px (spacious)
- **Corner radius:** 8px (standard), 12px (large buttons)
- **Safe area:** Respected on all screens using ScreenContainer

## Interaction Patterns

- **Button Press:** Scale to 0.97 with light haptic feedback
- **List Item Press:** Opacity to 0.7
- **Long Press:** Highlight with background color change
- **Swipe Actions:** Reveal delete/archive options
- **Haptic Feedback:** Used for confirmations and alerts

## Accessibility

- Minimum touch target size: 44x44 points
- Color contrast ratio: At least 4.5:1 for text
- Font size: Minimum 16px for body text
- All interactive elements have clear labels
- Support for system font size scaling
