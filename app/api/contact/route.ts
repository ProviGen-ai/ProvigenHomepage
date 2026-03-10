import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, message, website } = await req.json();

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

    // Send inquiry to Provigen
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: "contact@provigen.ai",
      replyTo: email,
      subject: `Contact form inquiry from ${email}`,
      text: `From: ${email}\n\nMessage:\n${message}`,
    });

    // Send confirmation to the sender
    await resend.emails.send({
      from: "Provigen <onboarding@resend.dev>",
      to: email,
      subject: "We received your message — Provigen",
      text: `Hi,\n\nThank you for reaching out to Provigen! We have received your message and will get back to you within 24 hours during business days.\n\nHere is a copy of your inquiry:\n\n${message}\n\nBest regards,\nThe Provigen Team\nhttps://provigen.ai`,
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
