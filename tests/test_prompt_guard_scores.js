// PromptGuard score report
// Usage: HUGGINGFACE_API_TOKEN=your_token node tests/test_prompt_guard_scores.js

import { sample_prompts } from './sample_prompts.js';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const PROMPT_GUARD_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-Prompt-Guard-2-22M";
const TIMEOUT_SECONDS = process.env.MODEL_TIMEOUT || 10;

if (!HF_TOKEN) {
    console.error("Error: HUGGINGFACE_API_TOKEN environment variable is not set.");
    process.exit(1);
}

async function getScore(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_SECONDS * 1000);

    try {
        const response = await fetch(PROMPT_GUARD_URL, {
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: text }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const result = await response.json();
            return result[0].find(r => r.label === 'LABEL_1').score;
        } else {
            return `ERROR (${response.status})`;
        }
    } catch (error) {
        clearTimeout(timeoutId);
        return error.name === 'AbortError' ? 'TIMEOUT' : `ERROR (${error.message})`;
    }
}

async function main() {
    const THRESHOLD = 0.9;
    const rows = [];

    for (const { prompt, expected } of sample_prompts) {
        const score = await getScore(prompt);
        const blocked = typeof score === 'number' && score > THRESHOLD;
        const correct = expected === 'dangerous' ? blocked : !blocked;
        rows.push({ prompt: prompt.slice(0, 80), expected, score, result: correct ? 'PASS' : 'FAIL!' });
    }

    console.table(rows);
}

main();
