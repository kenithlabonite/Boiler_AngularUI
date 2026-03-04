const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log(`Success with ${modelName}:`, response.text());
        return true;
    } catch (error) {
        console.error(`Error with ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    for (const m of modelsToTest) {
        if (await testModel(m)) break;
    }
}

runTests();
