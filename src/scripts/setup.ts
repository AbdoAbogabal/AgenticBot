import * as path from 'path';
import { GoogleGenAI } from "@google/genai";
import { API_KEY } from '../Utilities/instructions';

async function run() {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const store = await ai.fileSearchStores.create({ config: { displayName: "TechFlow_Knowledge_Base_2026" } });

    const filesToUpload = ["../knowledge/services.txt", "../knowledge/troubleshooting.txt"];

    for (const filePath of filesToUpload) {
        console.log(`Uploading ${filePath}...`);
        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
            file: filePath,
            fileSearchStoreName: store.name,
            config: { displayName: path.basename(filePath) }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            operation = await ai.operations.get({ name: operation.name });
        }
        console.log(`✓ Indexed: ${filePath}`);
    }
}

run();