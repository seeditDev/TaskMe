# 🚀 GitHub Repository Setup Guide

Complete step-by-step guide to create the GitHub repository with releases.

---

## 📋 Prerequisites

- GitHub account: https://github.com/signup
- Git installed locally
- TaskMe project ready

---

## Step 1: Create GitHub Repository

### 1.1 Go to GitHub
🔗 https://github.com/new

### 1.2 Fill Repository Details
```
Repository name: TaskMe
Description: Your personal task and note manager with auto-update
Visibility: Public  (or Private if preferred)
Initialize with: ☑️ Add a README file
                ☑️ Add .gitignore (Node)
                ☑️ Choose a license (MIT)
```

### 1.3 Click "Create repository"

---

## Step 2: Link Local Project to GitHub

### 2.1 Open Terminal in Project Root
```bash
cd "c:\Users\ashok\Downloads\Development Works\Taskme"
```

### 2.2 Initialize Git (if not already)
```bash
# Check if git is initialized
git status

# If not initialized:
git init
```

### 2.3 Add GitHub Remote
```bash
# Replace with your actual GitHub username
git remote add origin https://github.com/seeditDev/TaskMe.git

# Verify remote
git remote -v
```

---

## Step 3: Prepare Project for GitHub

### 3.1 Update .gitignore
Create/Update `.gitignore`:
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
web-build/
*.apk
*.aab
*.ipa

# Expo
.expo/
.expo-shared/

# Native
android/app/build/
android/build/
android/.gradle/
android/local.properties
ios/build/
ios/Pods/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary
*.tmp
*.temp
```

### 3.2 Add All Files to Git
```bash
# Add all files
git add .

# Check what's being added
git status
```

---

## Step 4: First Commit and Push

### 4.1 Create Initial Commit
```bash
git commit -m "🎉 Initial commit - TaskMe v1.0.1

Features:
- Task and note management
- Reminders with notifications
- Voice feedback
- Activity history
- GitHub auto-update system
- QR code distribution
- Website integration

Built with React Native + Expo"
```

### 4.2 Push to GitHub
```bash
# Push main branch
git branch -M main
git push -u origin main

# If prompted, enter GitHub credentials
```

---

## Step 5: Create First Release

### 5.1 Build Release APK

#### Option A: Local Build
```bash
# Navigate to android directory
cd android

# Make gradlew executable (Linux/Mac)
chmod +x gradlew

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Option B: Use GitHub Actions (Recommended)
Skip to Step 6 for automatic builds.

### 5.2 Create Git Tag
```bash
# Go back to project root
cd ..

# Create annotated tag
git tag -a v1.0.1 -m "Release version 1.0.1

🎉 First public release

Features:
- Complete task management
- Notes with folders and tags
- Push notifications for reminders
- Voice feedback system
- Activity history tracking
- GitHub auto-update integration
- QR code distribution ready

Download and enjoy!"

# Push tag to GitHub
git push origin v1.0.1
```

### 5.3 Create GitHub Release Manually

1. Go to: https://github.com/seeditDev/TaskMe/releases
2. Click "Draft a new release"
3. Choose tag: `v1.0.1`
4. Release title: `Version 1.0.1`
5. Description:
```markdown
## 🎉 TaskMe v1.0.1 Released!

### What's New
- ✅ Complete task management system
- 📝 Notes with folders and tags
- 🔔 Push notifications for reminders  
- 🔊 Voice feedback for actions
- 📊 Activity history tracking
- 🔄 GitHub auto-update integration
- 📱 QR code distribution ready

### Download
📦 [app-release.apk](link-to-apk)

### Install
1. Download APK
2. Open file on Android device
3. Allow "Install from unknown sources" if prompted
4. Enjoy TaskMe!

### Requirements
- Android 5.0+ (API 21)
- ~20 MB storage

---
Made with ❤️ by [SEED-ITES](https://seedit.site)
```

6. Upload `app-release.apk`
7. Click "Publish release"

---

## Step 6: Setup GitHub Actions (Auto-Build)

### 6.1 Verify Workflow File
Ensure `.github/workflows/build-release.yml` exists (already created).

### 6.2 Enable GitHub Actions
1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select:
   - ☑️ Read and write permissions
3. Click "Save"

### 6.3 Create Release with Git Tag (Automatic Build)
```bash
# After pushing code, create tag
git tag v1.0.2
git push origin v1.0.2

# GitHub Actions will automatically:
# 1. Build APK
# 2. Create release
# 3. Upload APK
# 4. Generate changelog
```

---

## Step 7: Setup GitHub Pages (Website)

### 7.1 Enable GitHub Pages
1. Go to: https://github.com/seeditDev/TaskMe/settings/pages
2. Source: Deploy from a branch
3. Branch: `main` / `docs`
4. Folder: `/docs`
5. Click "Save"

### 7.2 Verify Website Files
Ensure these files exist in `docs/`:
- `website-download-page.html` (rename to `index.html`)
- `README-GITHUB-UPDATE.md`
- `GITHUB-WORKS-COMPLETED.md`

### 7.3 Rename Website File
```bash
# Copy website page to docs folder
cp docs/website-download-page.html docs/index.html

git add docs/index.html
git commit -m "Add GitHub Pages index"
git push origin main
```

### 7.4 Access Website
After a few minutes, visit:
🔗 https://seeditDev.github.io/TaskMe

Or use custom domain: https://seedit.site/taskme

---

## Step 8: Generate QR Code

### Option 1: Online Generator
1. Go to: https://www.qr-code-generator.com/
2. Enter URL: `https://github.com/seeditDev/TaskMe/releases/latest`
3. Customize design (optional)
4. Download PNG/SVG
5. Add to website and README

### Option 2: npm package
```bash
# Install qrcode
npm install -g qrcode

# Generate QR code
qrcode "https://github.com/seeditDev/TaskMe/releases/latest" -o qr-code.png
```

### Option 3: Use in App
Install QR library:
```bash
npm install react-native-qrcode-svg
# or
npx expo install react-native-qrcode-svg
```

---

## Step 9: Create Additional Releases

### For Each New Version:

```bash
# 1. Update version in build.gradle
# android/app/build.gradle:
# versionCode 3
# versionName "1.0.2"

# 2. Update version.json
# version.json:
# { "version": "1.0.2", "versionCode": 3, ... }

# 3. Update CHANGELOG.md

# 4. Commit changes
git add .
git commit -m "Prepare v1.0.2 release

Changes:
- Feature 1
- Feature 2
- Bug fix"

# 5. Create and push tag
git tag v1.0.2
git push origin v1.0.2

# 6. GitHub Actions builds automatically!
```

---

## Step 10: Verify Everything Works

### Checklist:
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] README.md displays correctly
- [ ] First release (v1.0.1) created
- [ ] APK uploaded to release
- [ ] GitHub Actions workflow running
- [ ] Website accessible (GitHub Pages)
- [ ] QR code generated and tested
- [ ] Download link works on Android device
- [ ] Auto-update check works in app

---

## 🐛 Troubleshooting

### Issue: "Permission denied" when pushing
```bash
# Use HTTPS with token
# Or setup SSH keys:
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub Settings → SSH Keys
```

### Issue: "Build failed" in GitHub Actions
```bash
# Check workflow file syntax
# Ensure android/ folder is committed
git add android/
git commit -m "Add Android project files"
git push origin main
```

### Issue: "APK not found"
```bash
# Check build output
cd android
./gradlew assembleRelease
ls -la app/build/outputs/apk/release/
```

### Issue: "Auto-update not working"
```bash
# Check:
1. Version code increased in build.gradle
2. APK uploaded to GitHub release
3. GitHub API accessible from device
4. FileProvider configured correctly
```

---

## 📞 Support

If you need help:
- 📧 Email: support@seedit.site
- 🐛 GitHub Issues: https://github.com/seeditDev/TaskMe/issues
- 🌐 Website: https://seedit.site/taskme

---

## 🎉 Success!

Once completed, your TaskMe app will be:
- ✅ Hosted on GitHub
- ✅ Available for download
- ✅ Auto-updating
- ✅ Shareable via QR code
- ✅ Accessible via website

**Share your app:**
```
Download TaskMe: https://github.com/seeditDev/TaskMe/releases/latest
Website: https://seedit.site/taskme
QR: [Generated QR Code]
```
