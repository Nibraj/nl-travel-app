import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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
        const user = userCred.user;

        await setDoc(doc(db, 'users', user.uid), {
          username,
          email: user.email,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const promptUsername = prompt('Enter a username to complete your profile:');
        if (promptUsername) {
          await setDoc(userRef, {
            username: promptUsername,
            email: user.email,
            createdAt: serverTimestamp(),
          });
        }
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isRegistering ? 'Create an Account' : 'Login'}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        {isRegistering && (
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 mb-3 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border rounded"
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

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-sm mt-5 text-center">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 underline font-medium"
          >
            {isRegistering ? 'Log in here' : 'Register here'}
          </button>
        </p>
      </form>
    </div>
  );
}
