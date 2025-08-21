import axios from 'axios';

// Define the Gemini API base URL
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Define types for Gemini API requests and responses
interface GeminiRequestContent {
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiRequestContent[];
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiResponsePart[];
  role: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: GeminiResponseContent;
    finishReason: string;
    index: number;
  }>;
}

// Enhanced API key validation with more detailed checks
export const validateApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
    return { valid: false, error: 'API key is missing' };
  }
  
  if (apiKey === 'your-api-key-here' || apiKey === 'GEMINI_API_KEY') {
    console.error('Gemini API key is a placeholder. Please replace with your actual API key in the .env file.');
    return { valid: false, error: 'API key is a placeholder' };
  }
  
  return { valid: true, error: null };
};

// Custom error handler for Gemini API errors
export const handleGeminiError = (error: any) => {
  // Rate limit errors
  if (error.response?.status === 429) {
    console.error('Gemini API rate limit exceeded:', error);
    return { type: 'rate_limit', message: 'Rate limit exceeded. Please try again in a few minutes.' };
  }
  
  // Authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    console.error('Gemini API authentication error:', error);
    return { type: 'auth_error', message: 'Invalid API key. Please check your Gemini API key.' };
  }
  
  // Server errors
  if (error.response?.status >= 500) {
    console.error('Gemini API server error:', error);
    return { type: 'server_error', message: 'Gemini servers are experiencing issues. Please try again later.' };
  }
  
  // Network errors
  if (error.message && (error.message.includes('network') || error.message.includes('timeout'))) {
    console.error('Network error when calling Gemini API:', error);
    return { type: 'network_error', message: 'Network error. Please check your internet connection.' };
  }
  
  // Default error
  console.error('Unexpected Gemini API error:', error);
  return { type: 'unknown_error', message: error.message || 'An unexpected error occurred.' };
};

// Create a function to generate content using Gemini API
export const generateContent = async (prompt: string, systemPrompt?: string) => {
  validateApiKey();
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  try {
    // Prepare the request payload
    const payload: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }
          ]
        }
      ]
    };
    
    // Make the API request
    const response = await axios.post<GeminiResponse>(
      GEMINI_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        }
      }
    );
    
    // Extract and return the generated content
    const generatedText = response.data.candidates[0]?.content.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }
    
    return generatedText;
  } catch (error) {
    throw error;
  }
};

// Create a chat completions interface similar to OpenAI for easier migration
export const chat = {
  completions: {
    create: async ({ messages, model, temperature, max_tokens }: any) => {
      // Extract the system message and user message
      const systemMessage = messages.find((msg: any) => msg.role === 'system')?.content || '';
      const userMessage = messages.find((msg: any) => msg.role === 'user')?.content || '';
      
      // Generate content using Gemini
      const content = await generateContent(userMessage, systemMessage);
      
      // Return in a format similar to OpenAI's response
      return {
        choices: [
          {
            message: {
              content,
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ]
      };
    }
  }
};

// Create a default export with the same structure as OpenAI client
const gemini = {
  chat
};

// Validate API key on initialization
validateApiKey();

export default gemini;