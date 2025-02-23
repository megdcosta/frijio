import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();
    
    const prompt = `Act as a professional chef. Suggest 3 creative recipes using these ingredients: ${ingredients.join(", ")}. 
      For each recipe, include:
      1. Recipe name
      2. Required ingredients (mark which are optional)
      3. Step-by-step instructions
      4. Estimated preparation time
      
      Format response as valid JSON:
      {
        "recommendations": [{
          "recipe": string,
          "ingredients": string[],
          "instructions": string[],
          "time": string
        }]
      }`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef providing recipe suggestions.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get recommendations');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('Failed to parse AI response');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
