
import { GoogleGenAI, GenerateContentResponse, Type, Modality, Chat, LiveServerMessage } from "@google/genai";
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
    // Fix: Sanitize grounding chunks to match the stricter GroundingSource type.
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks.reduce((acc: GroundingSource[], chunk) => {
        const source: GroundingSource = {};
        if (chunk.web?.uri && chunk.web.title) {
            source.web = { uri: chunk.web.uri, title: chunk.web.title };
        }
        if (chunk.maps?.uri && chunk.maps.title) {
            source.maps = { uri: chunk.maps.uri, title: chunk.maps.title };
        }
        if (source.web || source.maps) {
            acc.push(source);
        }
        return acc;
    }, []);
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

    // Fix: Sanitize grounding chunks to match the stricter GroundingSource type.
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks.reduce((acc: GroundingSource[], chunk) => {
        const source: GroundingSource = {};
        if (chunk.web?.uri && chunk.web.title) {
            source.web = { uri: chunk.web.uri, title: chunk.web.title };
        }
        if (chunk.maps?.uri && chunk.maps.title) {
            source.maps = { uri: chunk.maps.uri, title: chunk.maps.title };
        }
        if (source.web || source.maps) {
            acc.push(source);
        }
        return acc;
    }, []);
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

// Fix: Infer return type of connectLive instead of importing non-existent LiveSession type.
export const connectLive = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}, systemInstruction: string) => {
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
            systemInstruction,
        },
    });
}