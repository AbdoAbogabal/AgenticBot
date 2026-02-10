import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import fs from "fs";
import readline from "readline";

const knowledge = JSON.parse(fs.readFileSync("../knowledge.json", "utf-8"));
const genAI = new GoogleGenerativeAI("AIzaSyDJm1uwCaHmBrUjZUOHSs4KF9OjUolSlHw");
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = {
    get_current_time: () => new Date().toLocaleString(),
    calculate_discount: ({ price, percent }) => price - (price * (percent / 100))
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `
    You are the TechFlow Solutions Assistant.
    KNOWLEDGE BASE: ${JSON.stringify(knowledge)}
    
    RULES:
    1. Use the KNOWLEDGE BASE to answer questions about company policies.
    2. If a customer asks for a discount, use the 'calculate_discount' tool.
    3. Always be polite and professional.
    4. If you don't know something, offer to email the emergency contact.`,
    tools: [{
        functionDeclarations: [
            {
                name: "calculate_discount",
                description: "Calculates a final price after a percentage discount.",
                parameters: {
                    type: "object",
                    properties: {
                        price: { type: "number" },
                        percent: { type: "number" }
                    },
                    required: ["price", "percent"]
                }
            },
            {
                name: "get_current_time",
                description: "Returns the current date and time."
            }
        ]
    }]
});

const chat = model.startChat({ history: [] });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function askAgent() {
    rl.question("You: ", async (userInput) => {
        if (userInput.toLowerCase() === "exit") return rl.close();

        try {
            let result = await chat.sendMessage(userInput);
            let response = result.response;

            const calls = response.functionCalls();
            if (calls && calls.length > 0) {
                for (const call of calls) {
                    console.log(`[Agent using tool: ${call.name}...]`);
                    const toolResult = tools[call.name](call.args);

                    result = await chat.sendMessage([{
                        functionResponse: { name: call.name, response: { result: toolResult } }
                    }]);
                }
                response = result.response;
            }

            console.log(`Agent: ${response.text()}\n`);
        } catch (err) {
            console.error("Error: Please check your API key or Quota. " + err);
        }
        askAgent();
    });
}

console.log("--- TechFlow AI Agent Online ---");
askAgent();