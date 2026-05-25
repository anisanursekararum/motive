import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();

    // Log the simulated outgoing email transmission to node console
    console.log("-----------------------------------------");
    console.log("SENDING DIRECT EMAIL VIA INTEGRATED MOTIVE PROXY");
    console.log(`From: anisanursekararum@gmail.com`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("Body Preview:");
    console.log(body);
    console.log("-----------------------------------------");

    // Simulate backend network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: `Email successfully delivered to ${to} from anisanursekararum@gmail.com`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
