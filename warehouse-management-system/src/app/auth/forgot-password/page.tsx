"use client";

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // For success or info messages

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/custom/send-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json(); // Try to parse JSON regardless of response.ok

      if (response.ok) {
        setMessage(data.message || "If an account with that email exists, a password reset link has been sent.");
      } else {
        setError(data.error || `An error occurred (status: ${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error("Forgot password submission error", err);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <p>Enter your email address below and we'll send you a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Send Password Reset Email</button>
      </form>
      <p>
        Remembered your password? <a href="/auth/login">Login here</a>
      </p>
    </div>
  );
}
