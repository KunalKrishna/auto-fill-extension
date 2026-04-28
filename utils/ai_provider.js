export async function generateContent(provider, apiKey, model, prompt) {
    if (provider === 'gemini') {
        return await generateGeminiContent(apiKey, model, prompt);
    } else if (provider === 'anthropic') {
        return await generateAnthropicContent(apiKey, model, prompt);
    } else if (provider === 'openai') {
        return await generateOpenAIContent(apiKey, model, prompt);
    } else if (provider === 'ollama') {
        return await generateOllamaContent(apiKey, model, prompt);
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

async function generateOpenAIContent(apiKey, model, prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';

    const payload = {
        model: model,
        messages: [
            { role: 'user', content: prompt }
        ],
        temperature: 0.1
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API Error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function generateOllamaContent(apiKey, model, prompt) {
    const baseUrl = apiKey || 'http://localhost:11434';
    const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;

    const payload = {
        model: model,
        messages: [
            { role: 'user', content: prompt }
        ],
        stream: false
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ollama API Error');
    }

    const data = await response.json();
    return data.message?.content || '';
}
