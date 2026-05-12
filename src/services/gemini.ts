import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingSize: string;
  suggestion: string;
}

export async function analyzeFood(input: string | { data: string; mimeType: string }) {
  const isImage = typeof input !== 'string';
  
  const prompt = isImage 
    ? "Identifikasi makanan dalam foto ini dan berikan rincian nutrisinya (kalori, protein, lemak, karbohidrat) per porsi standar. Berikan juga saran singkat apakah makanan ini sehat/cocok untuk target kesehatan umum."
    : `Analisis nutrisi untuk: ${input}. Jika itu adalah makanan, berikan rincian energinya (kalori, protein, lemak, karbohidrat) per porsi standar. Jika bukan makanan, berikan pesan error yang sopan.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: isImage 
      ? { parts: [{ inlineData: input }, { text: prompt }] }
      : prompt,
    config: {
      systemInstruction: "Anda adalah NutriCalc AI, ahli diet digital. Berikan jawaban dalam Bahasa Indonesia yang profesional dan informatif. Selalu sertakan rincian nutrisi dalam format JSON jika memungkinkan.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          servingSize: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
        required: ["name", "calories", "protein", "fat", "carbs", "servingSize", "suggestion"]
      }
    }
  });

  return JSON.parse(response.text) as NutritionData;
}
