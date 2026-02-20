import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });

    return NextResponse.json({ message: "Message sent successfully" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}