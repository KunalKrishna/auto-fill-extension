# Intelligent Form Filler Extension

An AI-powered Chrome Extension that automatically fills web forms using your personal profile data and Google Gemini.

Demo : https://jumpshare.com/s/w8f8ybLwfr4OCGLkYpeZ

## Features
- **Auto-Fill**: Automatically detects forms and fills them with your saved details.
- **Context Aware**: Uses Gemini AI to understand form fields (even with weird names) and map them to your profile.
- **Force Fill**: Manually trigger form filling on difficult pages.
- **Right-Click to Save**: Easily add new fields to your profile by right-clicking them on any webpage.
- **Secure**: Your API Key and Data are stored locally in your browser (`chrome.storage.local`).

## Requirements
- **Google Chrome** (or Chromium-based browser).
- **Gemini API Key**: You need a free API key from Google.
  - Get it here: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Installation
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked**.
5. Select the folder containing this project (the folder with `manifest.json`).

## How to Use
1. **Setup**:
   - Click the extension icon in your toolbar.
   - Paste your **Gemini API Key** and click "Save Config".
   - (Optional) Select a different Gemini Model if you wish.
2. **Create Profile**:
   - Fill in your details (Name, Address, etc.) in the extension popup.
   - Click "**+ Add Field**" to add custom fields (e.g., "LinkedIn", "Portfolio", "Veteran Status").
   - Click "**Save Profile**".
3. **Auto-Filling**:
   - Navigate to a page with a form (e.g., a job application).
   - The extension will automatically try to fill it.
   - If it doesn't fill automatically, open the extension popup and click **Force Auto-Fill Page**.
4. **Saving New Fields**:
   - If you encounter a field you want to save for later, **Right-Click** inside the input box.
   - Select **"Save value to Auto-Fill Profile"**.
   - It will be saved to your profile (you can rename it in the popup later).

## Troubleshooting
- **Not filling?** Try the "Force Auto-Fill Page" button.
- **Error in console?** Press `F12` to open Developer Tools and look for `[Gemini Auto-Fill]` messages.
- **Quota Exceeded?** Ensure your API Key is valid and has quota.
