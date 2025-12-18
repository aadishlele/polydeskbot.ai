import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants.ts';

let chatSession: Chat | null = null;

export const initializeChat = (): void => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      tools: [{ googleSearch: {} }],
    },
  });
};

export const sendMessageToGemini = async (
  message: string,
  onChunk: (text: string) => void
): Promise<void> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  try {
    const responseStream = await chatSession.sendMessageStream({ message });

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("I'm having trouble connecting to the University servers right now. Please try again later.");
  }
};