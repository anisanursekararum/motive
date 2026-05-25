import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task, DailyNote } from '@/types';

interface SummarizeRequestPayload {
  tasks: Task[];
  notes: DailyNote[];
  dateRange?: string;
  language?: 'en' | 'id';
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tasks, notes, dateRange, language }: SummarizeRequestPayload = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const langInstructions = language === 'id'
      ? "CRITICAL: You MUST write all the textual explanations (for 'experience', 'reflection', 'action', and dailyHighlights 'highlight' attributes) completely in Bahasa Indonesia (Indonesian)."
      : "CRITICAL: You MUST write all the textual explanations (for 'experience', 'reflection', 'action', and dailyHighlights 'highlight' attributes) completely in English.";

    const prompt = `
      You are an expert productivity coach and AI analyst. Analyze the following user data (tasks and journal notes) for the period ${dateRange || 'today'} and generate an Executive Reflection & Analysis (ERA) summary.
      
      Tasks: ${JSON.stringify(tasks)}
      Notes: ${JSON.stringify(notes)}
      
      ${langInstructions}
      
      Please structure your response strictly in JSON format matching this schema. Focus on deep, professional, highly contextual, and non-generic insights that strictly correspond to the provided tasks and notes. If tasks or notes are empty, use the current period information to construct a realistic encouraging baseline, but if there is data, analyze it thoroughly:
      {
        "experience": "Detailed, highly specific summary of accomplishments and experiences found in the tasks and notes. Focus on exact achievements, projects completed, or focus states.",
        "reflection": "Deep analysis of the bottlenecks, challenges, feelings of anxiety or focus, distraction, or key insights found in the notes and task categories.",
        "action": "Concrete, actionable 2-3 step roadmap to improve productivity and emotional balance based on these insights.",
        "dailyHighlights": [
          {
            "date": "YYYY-MM-DD corresponding to days in the period that had activity",
            "highlight": "A powerful one-sentence summary of what was achieved, experienced, or reflected on this day"
          }
        ]
      }
      
      Return ONLY the raw JSON object. Do not wrap in \`\`\`json. Ensure the JSON is well-formed and valid.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up if it contains markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const eraSummary = JSON.parse(text);
    
    return NextResponse.json(eraSummary);
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    return NextResponse.json({ error: error?.message || 'Failed to generate summary' }, { status: 500 });
  }
}
