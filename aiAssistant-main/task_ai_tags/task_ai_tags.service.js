require('dotenv').config(); // ← add this as the FIRST line
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function classifyPriority(description) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const today = new Date().toISOString().split('T')[0]; // gets today's date e.g. "2026-02-25"

const prompt = `
    You are a strict task priority classifier. Respond with ONLY a JSON object, nothing else.
    No markdown, no explanation, no code blocks.

    Today's date is ${today}.

    Rules:
    - Priority must be exactly one of: Low, Medium, High
    - Low = casual, no urgency, no deadline pressure
    - Medium = somewhat important, has a rough timeframe
    - High = urgent, critical, or has a near deadline

    Deadline rules:
    - If a specific date is mentioned, use it in YYYY-MM-DD format
    - If relative time is mentioned (e.g. "this month", "next week"), calculate from today's date
    - If no deadline is mentioned, use null

    Example response:
    {"priority": "Low", "deadline": null}

    Task: "${description}"
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        console.log("Gemini raw response:", text);

        // Remove markdown code blocks if Gemini wraps it in ```json ... ```
        const cleaned = text.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(cleaned);  // ← parse the JSON Gemini returns

        return {
            priority: extractPriority(parsed.priority),
            deadline: parsed.deadline ?? null,  // ← now actually extracted
            raw: text
        };

    } catch (error) {
        console.error("Gemini Error:", error);

        return {
            priority: "Medium",
            deadline: null,
            raw: "Fallback"
        };
    }
}

function extractPriority(text) {
    const cleaned = text.toLowerCase();

    if (cleaned === "high") return "High";
    if (cleaned === "medium") return "Medium";
    if (cleaned === "low") return "Low";

    // fallback if Gemini misbehaves
    if (cleaned.includes("high")) return "High";
    if (cleaned.includes("low")) return "Low";

    return "low"; 
}

module.exports = {
    classifyPriority
};