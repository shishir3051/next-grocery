import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProducts, getProducts } from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Validate API key early — same pattern as krishibangla chat route
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    console.log('Smart Search API: Checking for GEMINI_API_KEY...');
    if (!GEMINI_KEY) {
      console.error('Smart Search Error: GEMINI_API_KEY is not defined.');
      return NextResponse.json({ error: 'Gemini API Key is missing. Check your .env file.' }, { status: 500 });
    }
    console.log('Smart Search API: Key loaded (starts with: ' + GEMINI_KEY.substring(0, 8) + '...)');

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a grocery shopping assistant for a Bangladeshi grocery store. 
The user asked: "${query}"

Extract the specific grocery product names or categories they need and provide a friendly suggestion message.

Respond ONLY in this exact JSON format with no extra text:
{
  "keywords": ["keyword1", "keyword2"],
  "suggestion": "A friendly 1-2 sentence assistant message explaining what you found for them"
}

Examples of keywords: tomatoes, milk, eggs, chicken, broccoli, rice, onion.
Keep keywords simple and common.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log('Gemini raw response:', text);

    // Robust JSON extraction — find the first { and last } to handle any surrounding text
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1) {
      console.error('No JSON block found in Gemini response:', text);
      throw new Error('No valid JSON block found in AI response');
    }

    const jsonContent = text.substring(startIdx, endIdx + 1);
    const parsed = JSON.parse(jsonContent);

    // Search products for each keyword
    const allProducts: any[] = [];
    const seenIds = new Set<string>();

    for (const keyword of (parsed.keywords || []).slice(0, 4)) {
      const results = await searchProducts(keyword);
      for (const p of results) {
        if (!seenIds.has(p._id)) {
          seenIds.add(p._id);
          allProducts.push(p);
        }
      }
    }

    // Fallback: return all products if nothing found
    if (allProducts.length === 0) {
      const fallback = await getProducts();
      return NextResponse.json({ products: fallback.slice(0, 8), suggestion: parsed.suggestion });
    }

    return NextResponse.json({ products: allProducts, suggestion: parsed.suggestion });
  } catch (error: any) {
    console.error('Smart search error:', error?.message || error);
    return NextResponse.json({ error: 'AI search failed', details: error?.message }, { status: 500 });
  }
}
