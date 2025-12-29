
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Connectivity Check ---

export const checkGeminiConnection = async (): Promise<boolean> => {
  try {
    // Attempt a minimal generation to verify API Key and connectivity
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return true;
  } catch (error) {
    console.error("Gemini Connection Check Failed:", error);
    return false;
  }
};

// --- Text Enhancement for Mahdar Platform ---

export const enhanceText = async (text: string, context: string = "general", lang: 'ar' | 'en' = 'ar'): Promise<string> => {
  try {
    const prompt = `
      You are a professional executive secretary. 
      Your task is to:
      1. Correct any spelling or grammar mistakes in the provided text.
      2. Rewrite the text to be formal, professional, and clear.
      
      Language: ${lang === 'ar' ? 'Arabic' : 'English'}
      Context: ${context} (e.g., meeting agenda, decision, title)
      
      Original Text: "${text}"
      
      Return ONLY the corrected and enhanced text without any explanations or quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error enhancing text:", error);
    return text; // Fallback to original
  }
};

// --- Strategic Planning for Departments ---

export const generateDepartmentPlan = async (name: string, currentDesc: string): Promise<{
  description: string;
  tasks: string[];
  kpis: { name: string; target: number; unit: string; current: number }[];
}> => {
  try {
    const prompt = `
      You are a strategic planning consultant for a hospital affairs department.
      Department: "${name}"
      Current Context: "${currentDesc}"

      Task:
      1. Refine the department description to be professional and strategic (in Arabic).
      2. Suggest 3-5 key strategic tasks (in Arabic).
      3. Suggest 3 relevant KPIs (Key Performance Indicators) with targets (in Arabic).

      Return strictly valid JSON:
      {
        "description": "...",
        "tasks": ["...", "..."],
        "kpis": [
           { "name": "...", "target": 100, "unit": "%", "current": 0 }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating department plan:", error);
    throw error;
  }
};

// --- Text Generation for Meeting Minutes ---

export const generateMeetingMinutes = async (rawNotes: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert executive secretary. Convert the following raw meeting notes into a structured JSON format. 
      
      Raw Notes:
      ${rawNotes}

      The output must be a valid JSON object with this schema:
      {
        "title": "Meeting Title",
        "date": "YYYY-MM-DD",
        "attendees": [{"name": "Name", "title": "Title", "type": "INTERNAL", "isPresent": true}],
        "decisions": [{"text": "Decision text", "type": "DECISION"}],
        "agenda": [{"title": "Agenda Item", "presenter": "Name", "duration": "15"}]
      }
      
      Ensure the language matches the input language (Arabic). Return ONLY the JSON string.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Error generating minutes:", error);
    throw error;
  }
};

// --- Audio Helper Functions for Live API ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const createPcmBlob = (data: Float32Array): { data: string; mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

export const decodeAudioData = async (
  data: string | Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> => {
  const byteData = typeof data === 'string' ? decode(data) : data;
  const dataInt16 = new Int16Array(byteData.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export { ai };
