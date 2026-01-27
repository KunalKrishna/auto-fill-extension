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

document.addEventListener('DOMContentLoaded', async () => {
    const profileStatus = document.getElementById('profileStatus');
    const keyStatus = document.getElementById('keyStatus');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('modelSelect');
    const profileFieldsContainer = document.getElementById('profileFields');

    // Load Settings
    const data = await chrome.storage.local.get(['geminiApiKey', 'geminiModel', 'userProfile']);

    if (data.geminiApiKey) {
        apiKeyInput.value = data.geminiApiKey;
    }

    if (data.geminiModel) {
        modelSelect.value = data.geminiModel;
    } else {
        modelSelect.value = "gemini-1.5-flash-latest"; // Default
    }

    const userProfile = data.userProfile || DEFAULT_FIELDS;
    renderFields(userProfile);

    // Save API Key & Model
    document.getElementById('saveKey').addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const model = modelSelect.value;

        if (key) {
            chrome.storage.local.set({ geminiApiKey: key, geminiModel: model }, () => {
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
