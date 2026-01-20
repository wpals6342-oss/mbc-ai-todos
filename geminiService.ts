
import { GoogleGenAI, Type } from "@google/genai";

// API_KEY는 환경 변수에서 직접 가져옵니다.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getTaskEnhancement = async (task: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Improve this task title and categorize it. Task: "${task}"` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedTitle: { type: Type.STRING, description: "Better and clearer task title" },
            priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            category: { type: Type.STRING, description: "A one-word category (e.g., Work, Health, Home)" }
          },
          required: ["enhancedTitle", "priority", "category"]
        }
      }
    });
    
    // response.text 속성을 사용하여 JSON 파싱
    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Gemini AI Enhancement Error:", error);
    return null;
  }
};
