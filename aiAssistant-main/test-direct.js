require('dotenv').config();

async function listModelsDirect() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    console.log(`Listing models via direct fetch...`);
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
            console.log("Allowed Models:");
            (data.models || []).forEach(m => console.log(`- ${m.name}`));
            if (!data.models || data.models.length === 0) console.log("No models found for this key.");
        } else {
            console.error(`Error (${response.status}):`, JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch Exception:", error.message);
    }
}

listModelsDirect();
