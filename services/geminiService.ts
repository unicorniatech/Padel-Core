
import { GoogleGenAI, GenerateContentResponse, Type, Modality, Chat, LiveSession, LiveServerMessage } from "@google/genai";
import { GroundingSource } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// --- Text & Chat ---

export const createChat = (systemInstruction: string): Chat => {
    return getAI().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        },
    });
};

export const groundedSearch = async (prompt: string): Promise<{ text: string, sources: GroundingSource[] }> => {
    const response: GenerateContentResponse = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};

export const mapsSearch = async (prompt: string, lat: number, lng: number): Promise<{ text: string, sources: GroundingSource[] }> => {
    const response: GenerateContentResponse = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: lat,
                        longitude: lng
                    }
                }
            }
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};


export const complexQuery = async (prompt: string): Promise<AsyncGenerator<string>> => {
    const response = await getAI().models.generateContentStream({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });

    async function* generator() {
        for await (const chunk of response) {
            yield chunk.text;
        }
    }
    return generator();
};

// --- Vision ---

export const analyzeImage = async (prompt: string, base64Image: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Image,
        },
    };
    const textPart = {
        text: prompt,
    };
    const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

export const analyzeVideo = async (prompt: string): Promise<string> => {
    // NOTE: This is a mocked implementation for demo purposes.
    // In a real application, you would handle video file uploads and processing.
    const fullPrompt = `Simula un análisis de un video de pádel con la siguiente petición del usuario: "${prompt}". Describe los movimientos clave, posibles errores y sugerencias de mejora como si hubieras visto el video.`;

    const response = await getAI().models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
    });
    return response.text;
};


// --- Live Audio ---

export const connectLive = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}): Promise<LiveSession> => {
    return getAI().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'Eres un entrenador de pádel amigable y experto llamado Core. Proporciona consejos concisos y útiles. Habla en español.',
        },
    });
}
