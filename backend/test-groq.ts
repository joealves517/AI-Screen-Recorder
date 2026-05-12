import { config } from "./src/config/index.js";
import Groq from "groq-sdk";
const groqClient = new Groq({ apiKey: config.groq.apiKey });
const targetLang = "Vietnamese";
const textsPayload = [{i:0, t:"water to a bowl along with some salt"}];
const prompt = `Translate each "t" field to ${targetLang}. Keep the "i" index unchanged.
Return ONLY a valid JSON array of objects with "i" and "t" fields.
No markdown, no commentary.

${JSON.stringify(textsPayload)}`;

async function test() {
  const response = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a professional translator for screen recordings. Output only the JSON array." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" }
  });
  console.log("RESPONSE:", response.choices[0].message.content);
}
test().catch(console.error);
