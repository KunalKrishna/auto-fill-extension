const DEFAULT_FIELDS = {
    "Full Name": "",
    "Email": "",
    "Phone": "",
    "Street Address": "",
    "City": "",
    "State": "",
    "Zip Code": "",
    "Country": "",
    "LinkedIn URL": "",
    "Portfolio URL": ""
};

const MODEL_OPTIONS = {
    gemini: [
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Latest)" },
        { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Latest)" },
        { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
    ],
    anthropic: [
        { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
        { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
        { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
        { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
        { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
        { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
        { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
        { value: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet" },
        { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    const profileStatus = document.getElementById('profileStatus');
    const keyStatus = document.getElementById('keyStatus');
    const apiKeyInput = document.getElementById('apiKey');
    const providerSelect = document.getElementById('providerSelect');
    const modelSelect = document.getElementById('modelSelect');
    const profileFieldsContainer = document.getElementById('profileFields');

    // Load Settings
    const data = await chrome.storage.local.get(['geminiApiKey', 'anthropicApiKey', 'selectedProvider', 'selectedModel', 'userProfile']);

    const provider = data.selectedProvider || 'gemini';
    providerSelect.value = provider;

    updateModelOptions(provider);

    if (provider === 'gemini') {
        apiKeyInput.value = data.geminiApiKey || '';
    } else {
        apiKeyInput.value = data.anthropicApiKey || '';
    }

    if (data.selectedModel) {
        modelSelect.value = data.selectedModel;
    }

    function updateModelOptions(selectedProvider) {
        modelSelect.innerHTML = '';
        MODEL_OPTIONS[selectedProvider].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            modelSelect.appendChild(option);
        });
    }

    // Handle Provider Change
    providerSelect.addEventListener('change', async () => {
        const newProvider = providerSelect.value;
        updateModelOptions(newProvider);

        // Load correct API key for this provider
        const keys = await chrome.storage.local.get(['geminiApiKey', 'anthropicApiKey']);
        apiKeyInput.value = (newProvider === 'gemini' ? keys.geminiApiKey : keys.anthropicApiKey) || '';

        // Pick first model as default if switching
        modelSelect.selectedIndex = 0;
    });

    const userProfile = data.userProfile || DEFAULT_FIELDS;
    renderFields(userProfile);

    // Save API Key & Model
    document.getElementById('saveKey').addEventListener('click', () => {
        const provider = providerSelect.value;
        const key = apiKeyInput.value.trim();
        const model = modelSelect.value;

        if (key) {
            const settingsToSave = {
                selectedProvider: provider,
                selectedModel: model
            };

            if (provider === 'gemini') {
                settingsToSave.geminiApiKey = key;
            } else {
                settingsToSave.anthropicApiKey = key;
            }

            chrome.storage.local.set(settingsToSave, () => {
                showStatus(keyStatus, 'Configuration Saved!', 'success');
            });
        } else {
            showStatus(keyStatus, 'Please enter a key.', 'error');
        }
    });

    // Save Profile
    document.getElementById('saveProfile').addEventListener('click', () => {
        const inputs = profileFieldsContainer.querySelectorAll('input');
        const newProfile = {};
        inputs.forEach(input => {
            newProfile[input.dataset.key] = input.value;
        });

        chrome.storage.local.set({ userProfile: newProfile }, () => {
            showStatus(profileStatus, 'Profile Saved!', 'success');
        });
    });

    // Force Fill
    document.getElementById('forceFill').addEventListener('click', async () => {
        const status = document.getElementById('profileStatus');
        showStatus(status, 'Triggering Auto-Fill...', 'success');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, { action: "force_fill" }, (response) => {
                    if (chrome.runtime.lastError) {
                        showStatus(status, 'Error: Refresh page first.', 'error');
                    } else {
                        window.close(); // Close popup to let user see
                    }
                });
            }
        } catch (e) {
            showStatus(status, 'Error triggering fill', 'error');
        }
    });

    // Add Field
    document.getElementById('addField').addEventListener('click', () => {
        const fieldName = prompt("Enter the name of the new field:");
        if (fieldName) {
            const currentInputs = profileFieldsContainer.querySelectorAll('input');
            const newProfile = {};
            currentInputs.forEach(input => {
                newProfile[input.dataset.key] = input.value;
            });
            newProfile[fieldName] = "";
            renderFields(newProfile);
        }
    });
});

function renderFields(profile) {
    const container = document.getElementById('profileFields');
    container.innerHTML = '';

    for (const [key, value] of Object.entries(profile)) {
        const row = document.createElement('div');
        row.className = 'field-row';

        row.innerHTML = `
      <div class="field-label">
        <span>${key}</span>
        <span class="remove-field" data-key="${key}">&times;</span>
      </div>
      <input type="text" value="${value}" data-key="${key}" placeholder="${key}">
    `;

        container.appendChild(row);

        // Add remove listener
        row.querySelector('.remove-field').addEventListener('click', (e) => {
            if (confirm(`Remove field "${key}"?`)) {
                delete profile[key];
                renderFields(profile);
            }
        });
    }
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status';
    }, 3000);
}
