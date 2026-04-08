import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { cartItems } = await request.json();

    if (!cartItems?.length) {
      return NextResponse.json({ error: 'Cart items required' }, { status: 400 });
    }

    // Validate API key early — same pattern as krishibangla chat route
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    console.log('Recipes API: Checking for GEMINI_API_KEY...');
    if (!GEMINI_KEY) {
      console.error('Recipes Error: GEMINI_API_KEY is not defined.');
      return NextResponse.json({ error: 'Gemini API Key is missing. Check your .env file.' }, { status: 500 });
    }
    console.log('Recipes API: Key loaded (starts with: ' + GEMINI_KEY.substring(0, 8) + '...)');

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a chef AI assistant for a Bangladeshi grocery store. 
The user has these items in their cart: ${cartItems.join(', ')}.

Suggest 3 recipes they can make using these ingredients. 
For each recipe, include any common missing ingredients they might want to add.

Respond ONLY in this exact JSON format with no extra text:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "time": "30 mins",
      "description": "A short 1-2 sentence description.",
      "missingIngredients": ["ingredient 1", "ingredient 2"]
    }
  ]
}

Keep it relevant to Bangladeshi cooking styles where appropriate. Be concise.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log('Gemini raw response (recipes):', text);

    // Robust JSON extraction — find the first { and last } to handle any surrounding text
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1) {
      console.error('No JSON block found in Gemini response:', text);
      throw new Error('No valid JSON block found in AI response');
    }

    const jsonContent = text.substring(startIdx, endIdx + 1);
    const parsed = JSON.parse(jsonContent);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Recipes error:', error?.message || error);
    return NextResponse.json({ error: 'AI recipe generation failed', details: error?.message }, { status: 500 });
  }
}
