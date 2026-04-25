# PowerShell Script: GitHub Repository Setup for TaskMe
# Run this script to prepare your local project for GitHub

Write-Host "🚀 TaskMe GitHub Setup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$repoName = "TaskMe"
$githubUsername = "seeditDev"
$repoUrl = "https://github.com/$githubUsername/$repoName.git"

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if in correct directory
$currentDir = Get-Location
$projectRoot = Split-Path -Parent $currentDir
if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Host "❌ Please run this script from the scripts/ folder inside TaskMe project" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot
Write-Host "📁 Project root: $projectRoot" -ForegroundColor Green

# Initialize git if not already
if (-not (Test-Path ".git")) {
    Write-Host "`n📝 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git config user.name "Ashok Selva Kumar E"
    git config user.email "ashok@seedit.site"
} else {
    Write-Host "`n✅ Git already initialized" -ForegroundColor Green
}

# Create .gitignore if not exists
if (-not (Test-Path ".gitignore")) {
    Write-Host "`n📝 Creating .gitignore..." -ForegroundColor Yellow
    @"
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
.vs/
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

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Local env files
.env*.local
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Check if remote exists
$remote = git remote -v 2>$null
if (-not $remote) {
    Write-Host "`n📝 Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    Write-Host "   Remote URL: $repoUrl" -ForegroundColor Gray
} else {
    Write-Host "`n✅ GitHub remote already configured" -ForegroundColor Green
    git remote -v
}

# Add all files to git
Write-Host "`n📝 Adding files to Git..." -ForegroundColor Yellow
Write-Host "   This may take a moment..." -ForegroundColor Gray

git add .

# Check git status
$status = git status --short
if ($status) {
    Write-Host "`n📋 Files to be committed:" -ForegroundColor Cyan
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "`n✅ No new files to commit" -ForegroundColor Green
}

# Create initial commit
Write-Host "`n📝 Creating initial commit..." -ForegroundColor Yellow
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

# Create main branch
Write-Host "`n📝 Setting up main branch..." -ForegroundColor Yellow
git branch -M main

# Instructions for pushing
Write-Host "`n" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Local setup complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Create repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Blue
Write-Host "   Repository name: $repoName" -ForegroundColor Gray
Write-Host "`n2. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Magenta
Write-Host "`n3. Create first release:" -ForegroundColor White
Write-Host "   git tag v1.0.1" -ForegroundColor Magenta
Write-Host "   git push origin v1.0.1" -ForegroundColor Magenta
Write-Host "`n4. Build APK:" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor Magenta
Write-Host "   .\gradlew assembleRelease" -ForegroundColor Magenta
Write-Host "`n5. Upload APK to GitHub release" -ForegroundColor White
Write-Host "`n📖 Full guide: GITHUB_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor White

# Pause
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
