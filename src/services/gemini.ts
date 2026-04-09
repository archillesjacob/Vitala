import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TriageResult {
  suspectedCondition: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  symptoms: string[];
  recommendedAction: string;
}

export async function analyzeSymptoms(input: string): Promise<TriageResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following patient symptoms described by a Community Health Volunteer: "${input}". 
    Extract the suspected condition (primarily Malaria or Pneumonia), urgency level, and a list of key symptoms.
    Provide a recommended action for the CHV.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suspectedCondition: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedAction: { type: Type.STRING }
        },
        required: ["suspectedCondition", "urgency", "symptoms", "recommendedAction"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface MUACResult {
  riskLevel: "RED" | "YELLOW" | "GREEN";
  measurementCm: number;
  recommendation: string;
}

export async function analyzeMUACImage(base64Image: string): Promise<MUACResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      {
        text: "Analyze this image of a child's arm with a MUAC tape. Determine the risk level (RED for Severe Acute Malnutrition, YELLOW for Moderate, GREEN for Healthy) based on the tape color visible. Estimate the measurement in cm if possible. Provide a recommendation."
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING, enum: ["RED", "YELLOW", "GREEN"] },
          measurementCm: { type: Type.NUMBER },
          recommendation: { type: Type.STRING }
        },
        required: ["riskLevel", "measurementCm", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
