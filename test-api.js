async function test() {
    const config = {
        useCustomAPI: true,
        aiProvider: 'google',
        customEndpoint: '',
        apiKey: '',
        modelName: 'models/gemini-2.5-flash' // this is what was causing problems
    };

    let { aiProvider, customEndpoint, apiKey, modelName } = config;
    let prompt = "Explain how AI works in a few words";
    
    let apiUrl, requestBody, headers;

    let googleModel = modelName || 'gemini-flash-latest';
    if (googleModel.startsWith('models/')) {
        googleModel = googleModel.replace('models/', '');
    }
    if (googleModel === 'gemini-2.5-flash') {
        googleModel = 'gemini-flash-latest';
    }
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`;
    headers = {
        'Content-Type': 'application/json'
    };
    requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    console.log("Fetching:", apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            return;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
            console.log("Success! Output:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("Unexpected data format:", data);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
