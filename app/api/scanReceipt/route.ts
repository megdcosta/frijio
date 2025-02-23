import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

async function isFoodItem(text: string): Promise<boolean> {
  const prompt = `You are a food identification assistant. Analyze the following text from a receipt and determine if it represents a food item. Consider variations and abbreviations. Respond ONLY with "YES" or "NO".

Text: "${text}"`;

  try {
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
            content: 'You are a food item classifier for grocery receipts.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API Error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Perplexity Response:', JSON.stringify(data, null, 2)); // Debugging
    
    // Updated response parsing
    const answer = data?.choices?.[0]?.message?.content?.trim().toUpperCase() || 'NO';
    return answer === 'YES';

  } catch (error) {
    console.error('Perplexity API request failed:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // Google Vision processing
    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return NextResponse.json(
        { error: 'No text detected' },
        { status: 400 }
      );
    }

    // Filter food items using Perplexity
    const lines = detections[0].description?.split('\n') || [];
    const foodItems = await Promise.all(
      lines.map(async (line) => {
        const isFood = await isFoodItem(line);
        return isFood ? line : null;
      })
    );

    // Filter out null values and format results
    const filteredItems = foodItems.filter(Boolean);

    return NextResponse.json({
      text: detections[0].description,
      items: filteredItems,
    });

  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}