# 🚀 Quick Start Commands

Copy and paste these commands to create your GitHub repository.

---

## Option 1: Run Automated Setup (Windows)

```powershell
# Double-click this file in File Explorer:
setup.bat

# Or run in PowerShell:
.\setup.bat
```

---

## Option 2: Manual Setup (All Platforms)

### Step 1: Initialize Git
```bash
# Navigate to project root
cd "c:\Users\ashok\Downloads\Development Works\Taskme"

# Initialize git (if not done)
git init

# Configure git
git config user.name "Ashok Selva Kumar E"
git config user.email "ashok@seedit.site"
```

### Step 2: Create GitHub Repository
1. Go to: https://github.com/new
2. Name: `TaskMe`
3. Visibility: Public
4. ✅ Initialize with README
5. ✅ Add .gitignore: Node
6. ✅ Add license: MIT
7. Click "Create repository"

### Step 3: Link and Push
```bash
# Add remote (replace with your username)
git remote add origin https://github.com/seeditDev/TaskMe.git

# Verify remote
git remote -v

# Add all files
git add .

# Commit
git commit -m "🎉 Initial commit - TaskMe v1.0.1

Complete task management app with:
- Task and note management
- Push notifications and reminders  
- Voice feedback system
- Activity history tracking
- GitHub auto-update system
- QR code distribution
- Website integration

Built with React Native + Expo + TypeScript
Developer: Ashok Selva Kumar E
Company: SEED-ITES (seedit.site)"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 4: Create First Release

### Build APK
```bash
# Navigate to android folder
cd android

# Build release APK (Windows)
.\gradlew assembleRelease

# Build release APK (Linux/Mac)
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Create Git Tag
```bash
# Go back to project root
cd ..

# Create tag
git tag -a v1.0.1 -m "Release version 1.0.1"

# Push tag
git push origin v1.0.1
```

### Upload to GitHub
1. Go to: https://github.com/seeditDev/TaskMe/releases
2. Click "Draft a new release"
3. Choose tag: `v1.0.1`
4. Title: `Version 1.0.1`
5. Upload: `android/app/build/outputs/apk/release/app-release.apk`
6. Click "Publish release"

---

## Step 5: Enable GitHub Actions (Auto-Build)

### One-Time Setup
1. Go to: https://github.com/seeditDev/TaskMe/settings/actions
2. Under "Workflow permissions"
3. Select: ☑️ Read and write permissions
4. Click "Save"

### For Future Releases
```bash
# Just push a tag - GitHub builds automatically!
git tag v1.0.2
git push origin v1.0.2
```

---

## Step 6: Enable GitHub Pages

1. Go to: https://github.com/seeditDev/TaskMe/settings/pages
2. Source: Deploy from a branch
3. Branch: `main` / Folder: `/docs`
4. Click "Save"
5. Wait 2-3 minutes
6. Visit: https://seeditDev.github.io/TaskMe

---

## Verify Links

After setup, verify these URLs work:

- **Repository**: https://github.com/seeditDev/TaskMe
- **Releases**: https://github.com/seeditDev/TaskMe/releases/latest
- **Website**: https://seeditDev.github.io/TaskMe (or https://seedit.site/taskme)

---

## Complete File Checklist

Before pushing, ensure these files exist:

- [ ] `README.md` - Main readme
- [ ] `LICENSE` - MIT license
- [ ] `CHANGELOG.md` - Version history
- [ ] `version.json` - Version metadata
- [ ] `.gitignore` - Git ignore rules
- [ ] `.github/workflows/build-release.yml` - CI/CD
- [ ] `docs/index.html` - Website page
- [ ] `docs/GITHUB-WORKS-COMPLETED.md` - Documentation
- [ ] `GITHUB_SETUP_GUIDE.md` - Setup guide
- [ ] `QUICK_START_COMMANDS.md` - This file

---

## Troubleshooting

### Git not recognized (Windows)
```powershell
# Download and install:
# https://git-scm.com/download/win

# Then restart terminal
```

### Permission denied when pushing
```bash
# Use HTTPS with token:
# https://github.com/settings/tokens

# Or setup SSH:
ssh-keygen -t ed25519 -C "ashok@seedit.site"
cat ~/.ssh/id_ed25519.pub
# Add key to: https://github.com/settings/keys
```

### Build fails
```bash
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleRelease
```

---

## Next Steps After Setup

1. ✅ Repository created
2. ✅ Code pushed
3. ✅ First release published
4. ✅ Website live
5. ⏭️ Generate QR code
6. ⏭️ Test download on Android device
7. ⏭️ Test auto-update in app
8. ⏭️ Share with friends!

---

## 📞 Need Help?

- Full guide: `GITHUB_SETUP_GUIDE.md`
- Architecture: `docs/github-update-system.md`
- Issues: Create issue at https://github.com/seeditDev/TaskMe/issues

---

**Ready to go! 🚀**
