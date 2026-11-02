import { GoogleGenerativeAI, GoogleGenerativeAIFetchError, type ResponseSchema } from "@google/generative-ai";

/** Model id in one place; override with GEMINI_MODEL without a code change. */
export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** The AI service can't be used right now (no key, key rejected, timeout, bad reply). Callers should fall back. */
export class AiUnavailableError extends Error {}

// After the key is rejected (401/403) stop calling Gemini for a while: every request would
// fail anyway and each failure adds latency. Cleared automatically, e.g. after a key rotation.
const PAUSE_AFTER_AUTH_FAILURE_MS = 5 * 60 * 1000;
let pausedUntil = 0;

export function isAiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && Date.now() >= pausedUntil;
}

interface GenerateJsonOptions {
  /** Instructions for the model. User text never goes here (prompt-injection hygiene). */
  system: string;
  /** The request content, including any user text. */
  prompt: string;
  /** JSON schema the reply must follow; Gemini enforces it server-side. */
  schema: ResponseSchema;
  timeoutMs?: number;
  temperature?: number;
}

/**
 * Asks Gemini for a JSON reply that matches `schema`.
 * Throws AiUnavailableError for every expected failure so routes can degrade gracefully.
 * Never logs the API key or the raw model output.
 */
export async function generateJson<T>({ system, prompt, schema, timeoutMs = 15_000, temperature = 0.4 }: GenerateJsonOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiUnavailableError("GEMINI_API_KEY is not set");
  if (Date.now() < pausedUntil) throw new AiUnavailableError("AI is paused after the API key was rejected");

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    {
      model: AI_MODEL,
      systemInstruction: system,
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature },
    },
    { timeout: timeoutMs }
  );

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (error) {
    if (error instanceof GoogleGenerativeAIFetchError) {
      if (error.status === 401 || error.status === 403) {
        pausedUntil = Date.now() + PAUSE_AFTER_AUTH_FAILURE_MS;
        console.error(`Gemini rejected the API key (HTTP ${error.status}). Create a new key and set GEMINI_API_KEY. AI is paused for 5 minutes.`);
      } else {
        console.error(`Gemini request failed (HTTP ${error.status ?? "unknown"}).`);
      }
      throw new AiUnavailableError(`Gemini request failed (${error.status ?? "unknown"})`);
    }
    console.error("Gemini request failed:", error instanceof Error ? error.message : error);
    throw new AiUnavailableError("Gemini request failed");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("Gemini returned a reply that is not valid JSON.");
    throw new AiUnavailableError("Gemini returned invalid JSON");
  }
}
