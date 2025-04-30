import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCred.user);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCred.user);
      }

      // ✅ Redirect to home (or dashboard)
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl p-8 rounded w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegistering ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold"
        >
          {isRegistering ? 'Sign Up' : 'Log In'}
        </button>

        <p className="text-sm mt-5 text-center">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-blue-600 underline font-medium"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Log in here' : 'Register here'}
          </button>
        </p>
      </form>
    </div>
  );
}
