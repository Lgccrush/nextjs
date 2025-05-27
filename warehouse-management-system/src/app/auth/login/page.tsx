"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    try {
      const response = await signIn('credentials', {
        redirect: false, // Important to handle errors on the client
        email,
        password,
        callbackUrl: '/', // Specify where to go on success, will be handled if response.ok
      });

      if (response?.ok && !response?.error) {
        router.push(response.url || '/'); // Redirect to callbackUrl or homepage
      } else {
        // Handle errors
        if (response?.error === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else {
          setError(response?.error || "An unknown error occurred during login.");
        }
      }
    } catch (err) {
      console.error("Login submission error", err);
      setError("An unexpected error occurred during login.");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        Forgot password? <a href="/auth/forgot-password">Reset here</a>
      </p>
      {/* Optional: Link to a registration page if you plan to add one */}
      {/* <p>
        Don't have an account? <a href="/auth/register">Sign up</a>
      </p> */}
    </div>
  );
}
