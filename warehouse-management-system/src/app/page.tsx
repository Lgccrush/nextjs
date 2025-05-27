"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { signIn, useSession } from 'next-auth/react'; // Added useSession
import { useRouter } from 'next/navigation'; // Corrected import for App Router

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter(); // router is already initialized above from useSession

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/inventory');
    }
  }, [status, session, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    try {
      const response = await signIn('credentials', {
        redirect: false, // Important to handle errors on the client
        email,
        password,
        callbackUrl: '/inventory', // Changed from '/'
      });

      if (response?.ok && !response?.error) {
        router.push(response.url || '/inventory'); // Redirect to callbackUrl or /inventory
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && (
            <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </p>
          )}
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
        <p className="text-center mt-4">
          <a href="/auth/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
            Forgot password? Reset here
          </a>
        </p>
        {/* Optional: Link to a registration page if you plan to add one */}
        {/* <p>
          Don't have an account? <a href="/auth/register">Sign up</a>
        </p> */}
      </div>
    </div>
  );
}
