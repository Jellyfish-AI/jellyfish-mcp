// Response type constants - messages will be modified based on PROMPT_GUARD_UNAVAILABLE setting
const RESPONSE_TYPES = {
    NO_TOKEN: 'PromptGuard token not found',
    INVALID_TOKEN: 'PromptGuard token invalid',
    BLOCKED: 'PromptGuard blocked for potential jailbreak', 
    PASSED: 'PromptGuard passed',
    UNAVAILABLE: 'PromptGuard unavailable',
    TIMEOUT: 'PromptGuard timed out'
};

// Get API token from environment variable
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const PROMPT_GUARD_UNAVAILABLE = process.env.MODEL_AVAILABILITY === 'true';
const PROMPT_GUARD_TIMEOUT = process.env.MODEL_TIMEOUT || 10;

// Get Hugging Face PromptGuard API URL
const PROMPT_GUARD_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-Prompt-Guard-2-86M";

// Get headers for API requests
const HEADERS = {
    "Authorization": `Bearer ${HF_TOKEN}`,
    "Content-Type": "application/json",
};

// Helper function to add default behavior to messages
function addDefaultBehavior(message, allowData) {
    const defaultText = allowData ? ' -- allowing data' : ' -- blocking data';
    return message + defaultText;
}

// Calls the PromptGuard model and returns status: 'blocked', 'passed', or 'unavailable'
async function query_prompt_guard(data) {

    try {
        // Add a timeout to the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROMPT_GUARD_TIMEOUT * 1000); // timeout for 1 second = 1000 milliseconds
        
        const response = await fetch(PROMPT_GUARD_URL, { 
            headers: HEADERS, 
            method: "POST", 
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if the request was successful
        if (response.ok) {
            const result = await response.json();

            // Check the PromptGuard score
            const score = result[0][1].score;

            if (score <= 0.9) {
                return RESPONSE_TYPES.PASSED;
            } else {
                return RESPONSE_TYPES.BLOCKED;
            }

        } else if (response.status === 401 || response.status === 403) {
            // Authentication error - invalid token
            return RESPONSE_TYPES.INVALID_TOKEN;
        } else {
            // Other API error - PromptGuard unavailable
            return RESPONSE_TYPES.UNAVAILABLE;
        }
    } catch (error) {
        // Check if it's a timeout error (AbortError)
        if (error.name === 'AbortError') {
            return RESPONSE_TYPES.TIMEOUT;
        } else {
            // Other network/API errors
            return RESPONSE_TYPES.UNAVAILABLE;
        }
    }
}

// Sanitizes the API response (required as part of the MCP specification)
// However, actually doing this robustly is non-trivial given Jellyfish
// is meant to return data that can be user-provided. This is fine in
// the context of "standard" tooling that can differentiate between
// data and code, but this is not the case for LLMs.
//
// As such, we instead use the PromptGuard model to check for jailbreaks.
// If one is detected, we return an error message instead of a normal response.
export async function sanitize_api_response(data) {
    // Check if HF token is missing
    if (!HF_TOKEN) {
        return {
            message: RESPONSE_TYPES.NO_TOKEN,
            data: JSON.parse(data)
        };
    }
    
    // Query PromptGuard - returns message string
    const message = await query_prompt_guard({inputs: data});
    
    // If blocked, always return error without data
    if (message === RESPONSE_TYPES.BLOCKED) {
        return {
            error: message
        };
    // If passed, always return data
    } else if (message === RESPONSE_TYPES.PASSED) {
        return {
            message: message,
            data: JSON.parse(data)
        };
    // PromptGuard unavailable, timed out, or invalid token -- return data if PROMPT_GUARD_UNAVAILABLE is true
    } else if (PROMPT_GUARD_UNAVAILABLE === true) {
        return {
            message: addDefaultBehavior(message, true),
            data: JSON.parse(data)
        };
    }
    
    // PromptGuard unavailable, timed out, or invalid token -- don't return data if PROMPT_GUARD_UNAVAILABLE is false
    return {
        error: addDefaultBehavior(message, false)
    };
}