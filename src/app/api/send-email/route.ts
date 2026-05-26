import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();

    // Log email transmission attempt to the Node console
    console.log("-----------------------------------------");
    console.log("NODEMAILER SMTP GMAIL TRANSMISSION INITIATED");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("-----------------------------------------");

    const emailUser = process.env.EMAIL_USER || 'motiveappmomentumandreflective@gmail.com';
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    if (!emailPass) {
      console.warn("EMAIL_PASS is missing in .env.local. Email was not sent.");
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_PASS is missing in your .env.local file. Please add EMAIL_PASS=your_gmail_app_password to .env.local and restart the server to receive real emails.'
        },
        { status: 400 }
      );
    }

    // Configure Gmail SMTP transporter using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"Motive App" <${emailUser}>`,
      to: to,
      subject: subject,
      text: body
    };

    // Send email via Gmail SMTP
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully via SMTP:", info.messageId);

    return NextResponse.json({
      success: true,
      message: `Email successfully delivered to ${to} via Gmail SMTP!`,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error("Gmail SMTP sending error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
