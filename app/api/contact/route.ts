import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, message, website, inquiryType } = await req.json();

    // Honeypot check — bots fill this hidden field, real users don't
    if (website) {
      // Return success to not reveal the check to bots
      return NextResponse.json({ success: true });
    }

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 },
      );
    }

    // Send inquiry to ProviGen
    await resend.emails.send({
      from: "Contact Form <noreply@provigen.ai>",
      to: "contact@provigen.ai",
      replyTo: email,
      subject: `Contact form inquiry from ${email}`,
      text: `Email: ${email}\nInquiry type: ${inquiryType || "Not specified"}\n\nMessage:\n${message}`,
    });

    // Send confirmation to the sender
    await resend.emails.send({
      from: "ProviGen <noreply@provigen.ai>",
      to: email,
      subject: "We received your message - ProviGen",
      text: `Hi,\n\nThank you for reaching out to ProviGen! We have received your message and will get back to you within 24 hours during business days.\n\nHere is a copy of your inquiry:\n\n${message}\n\nBest regards,\nThe ProviGen Team\nhttps://provigen.ai`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
