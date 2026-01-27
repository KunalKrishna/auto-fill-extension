import { generateContent } from '../utils/gemini.js';

// Setup Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-profile",
        title: "Save value to Auto-Fill Profile",
        contexts: ["editable"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-profile") {
        // We need to ask the content script for the value and label
        chrome.tabs.sendMessage(tab.id, { action: "get_clicked_element" }, (response) => {
            if (response && response.value) {
                saveToProfile(response.value, response.label);
            }
        });
    }
});

async function saveToProfile(value, label) {
    // We can't easily prompt in background.
    // We'll default to the label found, and maybe show a notification?
    // Or open a small popup window?
    // For simplicity, we'll save it and notify.

    const data = await chrome.storage.local.get('userProfile');
    const profile = data.userProfile || {};

    // If label exists, append "_new" or something?
    // Let's just trust the label for now.
    const key = label || "New Field";

    profile[key] = value;

    await chrome.storage.local.set({ userProfile: profile });

    // Optionally notify user
    // chrome.notifications.create is an option if we added permissions, 
    // but let's just log it for now or assume popup check.
    console.log(`Saved ${key}: ${value}`);
}


// Handle Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze_and_map") {
        handleAnalysis(request.formData, request.userProfile).then(sendResponse);
        return true; // Keep channel open
    }
});

async function handleAnalysis(formData, userProfile) {
    try {
        const data = await chrome.storage.local.get(['geminiApiKey', 'geminiModel']);
        if (!data.geminiApiKey) return { error: "No API Key" };

        const model = data.geminiModel || "gemini-1.5-flash";

        const prompt = `
      You are an intelligent form filling assistant.
      
      User Profile Data:
      ${JSON.stringify(userProfile, null, 2)}
      
      Target Form Structure:
      ${JSON.stringify(formData, null, 2)}
      
      Task:
      Map the User Profile Data to the Target Form Structure.
      Return a JSON object where the keys are the IDs from the Target Form Structure, and the values are the values to fill.
      
      Rules:
      1. If a field matches a key in the User Profile (fuzzy match), use that value.
      2. If a field is boolean (checkbox), return true/false based on profile (e.g., "Visa Sponsorship").
      3. If a field asks for something not in profile, leave it out or try to infer reasonably (e.g. "Country" -> "USA" if address implies it).
      4. Return ONLY the JSON object. No markdown.
      5. STRICTLY use only values from the User Profile. Do not generate fake data. If a field matches nothing in the profile, map it to null or omit it.
    `;

        const resultText = await generateContent(data.geminiApiKey, prompt, model);
        console.log("Raw Gemini Response:", resultText);

        // Clean result (remove markdown code blocks if present)
        const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const mappings = JSON.parse(cleaned);

        return { mappings };

    } catch (error) {
        console.error("Analysis failed", error);
        return { error: error.message };
    }
}
