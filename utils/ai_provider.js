export async function generateContent(provider, apiKey, model, prompt) {
    if (provider === 'gemini') {
        return await generateGeminiContent(apiKey, model, prompt);
    } else if (provider === 'anthropic') {
        return await generateAnthropicContent(apiKey, model, prompt);
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
}

async function generateGeminiContent(apiKey, model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function generateAnthropicContent(apiKey, model, prompt) {
    const url = 'https://api.anthropic.com/v1/messages';

    const payload = {
        model: model,
        max_tokens: 4096,
        messages: [
            { role: 'user', content: prompt }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true' // Required for browser-side fetch
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Anthropic API Error');
    }

    const data = await response.json();
    return data.content[0].text;
}
