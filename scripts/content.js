// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fill_form") {
        // Legacy support if needed
        handleFillRequest(request.data);
    } else if (request.action === "force_fill") {
        log("Force Fill triggered by user.");
        scanAndProcessForms();
        sendResponse({ status: "started" });
    } else if (request.action === "get_clicked_element") {
        // This is trickier because context menu click doesn't give us the element directly in MV3 background.
        // We need to track the last right-clicked element.
        if (lastRightClickedElement) {
            let value = lastRightClickedElement.value;
            if (lastRightClickedElement.type === 'checkbox' || lastRightClickedElement.type === 'radio') {
                value = lastRightClickedElement.checked ? "true" : "false";
            }
            const label = findLabel(lastRightClickedElement);
            sendResponse({ value, label });
        } else {
            sendResponse(null);
        }
    }
    return true;
});

let lastRightClickedElement = null;

document.addEventListener("contextmenu", (event) => {
    lastRightClickedElement = event.target;
}, true);


// Auto-scan on load and if already loaded
if (document.readyState === 'complete') {
    setTimeout(scanAndProcessForms, 1000);
} else {
    window.addEventListener('load', () => {
        setTimeout(scanAndProcessForms, 1000);
    });
}

function log(msg, data) {
    console.log(`[Gemini Auto-Fill] ${msg}`, data || '');
}

async function scanAndProcessForms() {
    log("Scanning for forms...");
    let formContainers = Array.from(document.querySelectorAll('form'));

    // Usage fallback: If no <form> tags, treat document.body as a container if it has inputs
    if (formContainers.length === 0) {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        if (inputs.length > 0) {
            log("No <form> tags found, checking body for inputs.");
            formContainers = [document.body];
        }
    }

    if (formContainers.length === 0) {
        log("No forms or inputs found.");
        return;
    }

    const checkStorage = await chrome.storage.local.get(['geminiApiKey', 'userProfile']);
    if (!checkStorage.geminiApiKey || !checkStorage.userProfile) {
        log("Missing API Key or Profile.");
        return;
    }

    log("Found potential forms:", formContainers.length);

    for (const container of formContainers) {
        if (container.querySelectorAll('input:not([type="hidden"]), select, textarea').length > 0) {
            processForm(container, checkStorage.userProfile, checkStorage.geminiApiKey);
            // We generally only want to fill the main form, but maybe we should try all valid ones?
            // Let's stick continuously to avoid breaking multiple sections.
        }
    }
}

async function processForm(form, profile, apiKey) {
    const formSnapshot = extractFormSnapshot(form);

    // Don't waste API calls on empty forms
    if (Object.keys(formSnapshot).length === 0) return;

    // Send to Background to ask Gemini
    log("Sending form to Gemini for analysis...", formSnapshot);
    chrome.runtime.sendMessage({
        action: "analyze_and_map",
        formData: formSnapshot,
        userProfile: profile
    }, (response) => {
        if (chrome.runtime.lastError) {
            log("Error communicating with background:", chrome.runtime.lastError);
            return;
        }
        log("Received response from Gemini:", response);
        if (response && response.mappings) {
            applyMappings(form, response.mappings);
        } else if (response && response.error) {
            log("Gemini Error:", response.error);
        }
    });
}

function extractFormSnapshot(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    const snapshot = {};

    inputs.forEach((input, index) => {
        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;

        const id = input.id || input.name || `field_${index}`;
        const label = findLabel(input);

        snapshot[id] = {
            type: input.type,
            label: label,
            placeholder: input.placeholder,
            name: input.name
        };

        if (input.tagName === 'SELECT') {
            snapshot[id].options = Array.from(input.options).map(o => o.text);
        }
    });
    return snapshot;
}

function findLabel(input) {
    if (input.labels && input.labels.length > 0) {
        return input.labels[0].innerText;
    }
    // Try previous sibling
    const prev = input.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.innerText;

    // Try wrapping label (if input didn't have .labels for some reason)
    if (input.parentElement.tagName === 'LABEL') return input.parentElement.innerText;

    return input.name || input.id || "Unknown Field";
}

function applyMappings(form, mappings) {
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach((input, index) => {
        const id = input.id || input.name || `field_${index}`;
        if (mappings[id] !== undefined) {
            const val = mappings[id];

            if (input.type === 'checkbox') {
                input.checked = val === true || val === 'true' || val === 'on' || val === 'yes';
            } else if (input.type === 'radio') {
                if (input.value === val) input.checked = true;
            } else {
                input.value = val;
            }

            // Dispatch events to ensure frameworks pick it up
            const events = ['input', 'change', 'blur'];
            events.forEach(evt => {
                input.dispatchEvent(new Event(evt, { bubbles: true }));
            });
            log(`Filled ${id} with ${val}`);
        }
    });
}
