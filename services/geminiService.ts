
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { type GeminiResponse } from '../types';

// System instruction for the AI Game Master
const SYSTEM_INSTRUCTION = `You are the Game Master for a detective game set in ancient China (Ming Dynasty), called "玲珑府" (Linglong Fu). Your role is to narrate the story, describe scenes, control non-player characters (NPCs), and manage the game state.
Your responses MUST be in a specific JSON format. Do not include any text outside of the JSON object. Do not use markdown backticks like \`\`\`json ... \`\`\`.

**CORE CHARACTER: 岳玲珑 (Yue Linglong)**
- Yue Linglong is the player's permanent partner and a genius detective. She is always with the player.
- **IMPORTANT**: You MUST NOT include "岳玲珑" in the 'characters' array in the scene data. She is a constant presence, not a regular scene NPC.
- When the player consults her, your response should be her analysis based on the clues provided in the prompt.

The game flows through these phases:
- NARRATIVE: You are telling a story. The user will click to continue. Set gamePhase to this when you want to deliver plot points.
- INVESTIGATION: The user can investigate points of interest in the scene. The user can also talk to characters. Set gamePhase to this when the scene is open for exploration.
- DIALOGUE: The user is talking to a character. Set gamePhase to this during a conversation.

**CRITICAL DIALOGUE RULE:** When the game is in the 'DIALOGUE' phase, you MUST ALWAYS return 'gamePhase': 'DIALOGUE' in your JSON response. You are NOT allowed to change the phase to 'INVESTIGATION' or 'NARRATIVE'. Only the user can end the dialogue.

Based on the user's input and the current game state, you will generate the next part of the story and update the game state.
The JSON structure you must follow is defined in the response schema.
Always provide a detailed, descriptive English prompt for 'locationImagePrompt' to generate a suitable background image.
When a clue is investigated and collected, make sure to remove it from the 'investigationPoints' list in the next scene update.

IMPORTANT RULE: When you set gamePhase to NARRATIVE, your 'scene' object MUST include the investigationPoints for the scene that will appear *after* the narrative is finished. This is crucial for a smooth transition.

**SPECIAL INSTRUCTION FOR GAME START:** The very first response to the user's "游戏开始" (Game start) prompt MUST have 'gamePhase' set to 'NARRATIVE'. The opening narrative MUST introduce the player's partner, 岳玲珑, and establish that she is working with the player on the case. This initial response must also contain the full scene data, including the 'investigationPoints' for the first investigation phase.

Make the story engaging and mysterious.
`;

// JSON schema for the AI's response, matching the GeminiResponse type.
const responseSchema = {
    type: Type.OBJECT,
    properties: {
      narrative: {
        type: Type.STRING,
        description: "The main story text or dialogue content for the current turn. This is what the user sees."
      },
      speaker: {
        type: Type.STRING,
        description: "The name of the character who is speaking. Use '旁白' (Narrator) for narration."
      },
      gamePhase: {
        type: Type.STRING,
        enum: ['NARRATIVE', 'INVESTIGATION', 'DIALOGUE'],
        description: "The current phase of the game after this turn. NARRATIVE for story progression, INVESTIGATION for exploring the scene, DIALOGUE for conversations."
      },
      scene: {
        type: Type.OBJECT,
        description: "The complete, updated state of the current scene.",
        properties: {
          location: {
            type: Type.STRING,
            description: "The name of the current location (e.g., '书房' - Study Room)."
          },
          locationImagePrompt: {
            type: Type.STRING,
            description: "A detailed, descriptive English prompt for generating a background image for this location. e.g., 'A traditional Chinese study room in the Ming Dynasty, with scrolls on the wall, a large wooden desk, and a window looking out to a bamboo garden, cinematic lighting, photorealistic'."
          },
          characters: {
            type: Type.ARRAY,
            description: "A list of names of all characters present in the current location. DO NOT include '岳玲珑' in this list.",
            items: { type: Type.STRING }
          },
          investigationPoints: {
            type: Type.ARRAY,
            description: "A list of points of interest or clues the player can investigate in the scene. Provide a unique ID for each.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { 
                  type: Type.STRING,
                  description: "A unique identifier for the investigation point (e.g., 'desk_clue_1')."
                },
                name: {
                  type: Type.STRING,
                  description: "The name of the investigation point displayed to the user (e.g., '桌上的信件' - Letter on the desk)."
                }
              },
              required: ['id', 'name']
            }
          }
        },
        required: ['location', 'locationImagePrompt', 'characters', 'investigationPoints']
      }
    },
    required: ['narrative', 'speaker', 'gamePhase', 'scene']
};

class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        // Per guidelines, initialize with an object { apiKey: ... }
        // The API_KEY is assumed to be available in process.env.
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    /**
     * Starts a new chat session with the game master AI.
     * @returns A Chat instance.
     */
    startChat(): Chat {
        // Per guidelines, use ai.chats.create for chat sessions.
        return this.ai.chats.create({
            model: 'gemini-2.5-flash', // A fast and capable model suitable for this game.
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7, // A bit of creativity for the story.
            },
        });
    }

    /**
     * Sends a message to the AI and gets a structured game state response.
     * @param chat The active Chat instance.
     * @param prompt The player's action or message.
     * @returns A promise that resolves to the parsed game response.
     */
    async sendMessage(chat: Chat, prompt: string): Promise<GeminiResponse> {
        try {
            const result: GenerateContentResponse = await chat.sendMessage({ message: prompt });
            
            // Per guidelines, use .text to get the response string.
            const responseText = result.text;

            // The model is instructed to return JSON, so we parse it.
            // A simple cleanup for potential markdown fences that might slip through, as a safeguard.
            const cleanedJson = responseText.trim().replace(/^```json\s*|\s*```\s*$/g, '');
            const parsedResponse: GeminiResponse = JSON.parse(cleanedJson);

            return parsedResponse;
        } catch (error) {
            console.error("Error communicating with Gemini or parsing response:", error);
            if (error instanceof SyntaxError) {
                 // Provide a more user-friendly error if JSON parsing fails.
                 throw new Error("Failed to parse AI response. The response was not valid JSON.");
            }
            // Re-throw other errors to be handled by the caller.
            throw error;
        }
    }
}

// Export a singleton instance of the service.
export const geminiService = new GeminiService();