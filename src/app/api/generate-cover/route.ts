import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, seed } = await req.json();

    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (!apiKey) {
      throw new Error("SERVER_MISCONFIGURATION: Missing API Key");
    }

    const randomSeed = Math.floor(Math.random() * 1000000);
    // URL to Pollinations backend directly
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=p-image&seed=${randomSeed}`;

    const pollResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!pollResponse.ok) {
       const text = await pollResponse.text();
       throw new Error(`Pollinations API error: ${pollResponse.status} ${text}`);
    }

    const imageBlob = await pollResponse.blob();

    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': pollResponse.headers.get('content-type') || 'image/jpeg',
      },
    });

  } catch (error: any) {
    console.error('Error in generate-cover:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
