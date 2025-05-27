import { NextResponse } from 'next/server';
import db from '../../../../../lib/db'; // Adjusted path to the Kysely db instance
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Helper function to add hours to a date
function addHours(date: Date, hours: number): Date {
  date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
  return date;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const user = await db
      .selectFrom('users')
      .select('id') // Select only needed fields, e.g., user ID
      .where('email', '=', email)
      .executeTakeFirst();

    if (user) {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(plainToken, 10); // Hash the token for storage
      const expires = addHours(new Date(), 1); // Token expires in 1 hour

      // Delete existing reset tokens for this email first to ensure only one active reset token.
      // The schema for verification_tokens has PRIMARY KEY (identifier, token),
      // so an identifier (email) can have multiple tokens. For password reset, we want only the latest.
      await db
        .deleteFrom('verification_tokens')
        .where('identifier', '=', email)
        // Optionally, you might want a 'type' column in verification_tokens
        // to differentiate between 'password-reset' and 'email-verification' tokens.
        // .where('type', '=', 'password-reset') // If you add a type column
        .execute();
      
      // Store the new token
      await db
        .insertInto('verification_tokens')
        .values({
          identifier: email,    // User's email
          token: hashedToken,   // Hashed token
          expires: expires,     // Expiry date
          // created_at: new Date() // The schema.sql already has DEFAULT CURRENT_TIMESTAMP
        })
        .execute();

      const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${plainToken}`;

      // Configure Nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        // Optional: Add timeout settings if needed
        // connectionTimeout: 5000, // 5 seconds
        // greetingTimeout: 5000, // 5 seconds
        // socketTimeout: 5000, // 5 seconds
      });

      // Send the email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`,
        html: `
          <p>You requested a password reset.</p>
          <p>Please click the following link to reset your password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
        `,
      });
    }

    // Always return a generic success message to prevent user enumeration
    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Error in send-reset-email API:', error);
    // It's good practice to check the error type for more specific messages if possible
    // For example, if (error instanceof SomeNodemailerError) { ... }
    return NextResponse.json({ error: 'An internal server error occurred. Please try again later.' }, { status: 500 });
  }
}
