import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { tasks, notes, dateRange } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert productivity coach and AI analyst. Analyze the following user data (tasks and journal notes) for the period ${dateRange} and generate an Executive Reflection & Analysis (ERA) summary.
      
      Tasks: ${JSON.stringify(tasks)}
      Notes: ${JSON.stringify(notes)}
      
      Please structure your response strictly in JSON format matching this schema, focusing on deep, professional insights:
      {
        "experience": "A summary of what was accomplished and experienced. Focus on highlights. Example: Achieved high-velocity output in architectural refinement.",
        "reflection": "An analysis of the challenges, distractions, or insights. Be specific. Example: Mid-week fragmentation due to administrative overhead.",
        "action": "A concrete, specific action plan for the future. Example: Shift administrative tasks to a Friday afternoon block."
      }
      
      Return ONLY the raw JSON object. Do not include markdown tags like \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up if it contains markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const eraSummary = JSON.parse(text);
    
    return NextResponse.json(eraSummary);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}

