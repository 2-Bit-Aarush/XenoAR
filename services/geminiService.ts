import { GoogleGenerativeAI } from "@google/generative-ai";
import { Object3DParams, CaptureImage } from "../types";

export const reconstructFromImages = async (images: CaptureImage[]): Promise<Object3DParams> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("INSERT")) {
    console.error("API Key Check Failed", { key: apiKey });
    throw new Error("Invalid API Key. Please check .env.local");
  }

  console.log(`Processing ${images.length} images for reconstruction...`);

  const genAI = new GoogleGenerativeAI(apiKey);
  // Use the latest flash model which is multimodal and fast
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType
    }
  }));

  const prompt = `You are a professional photogrammetry engine.
  Analyze the ${images.length} provided images of the object from different angles.
  
  Your goal is to generate a 3D Mesh that ACCURATELY matches the real-world object.
  
  OUTPUT REQUIREMENT:
  Return detailed JSON with 'shapeType': 'complex' and 'meshData'.
  
  JSON SCHEMA:
  {
    "name": "string (short description)",
    "shapeType": "complex",
    "meshData": {
       "vertices": [x, y, z, ...], // Flattened array of vertices. Keep count < 500 for performance.
       "indices": [a, b, c, ...]   // Flattened array of triangle indices
    },
    "dimensions": { "width": number, "height": number, "depth": number },
    "material": { 
       "color": "#hex", 
       "metalness": 0-1, 
       "roughness": 0-1,
       "textureDesc": "legacy-param-ignored" 
    },
    "spatialDescription": "string"
  }
  
  CRITICAL:
  - Do NOT assume a generic primitive. Warped/organic shapes are expected.
  - Scale the object so it fits within a 1x1x1 unit box.
  - Use ALL images to infer depth and hidden sides.
  `;

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI Response:", text.substring(0, 100) + "...");

    try {
      const data = JSON.parse(text);
      return data as Object3DParams;
    } catch (e) {
      console.error("JSON Parse Error", text);
      throw new Error("AI returned invalid JSON geometry.");
    }

  } catch (error: any) {
    console.error("Reconstruction Error:", error);
    throw new Error(error.message || "Failed to generate 3D model.");
  }
};
