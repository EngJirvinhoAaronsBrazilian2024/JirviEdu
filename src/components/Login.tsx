import React, { useState } from 'react';
import { BookOpen, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import clsx from 'clsx';

export default function Login({ setRole }: { setRole: (role: string | null) => void }) {
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regNumber === 'REG-ADMIN-2026') {
      setRole('admin');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('regNumber', '==', regNumber));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Fallback for demo: if not found, just let them in as mock
        console.warn('Student not found in DB, proceeding with mock auth');
        localStorage.setItem('jirvi_student_reg', regNumber);
        localStorage.setItem('jirvi_student_id', 'mock_student_1');
        setRole('student');
      } else {
        const docSnap = snap.docs[0];
        localStorage.setItem('jirvi_student_reg', regNumber);
        localStorage.setItem('jirvi_student_id', docSnap.id);
        setRole('student');
      }
    } catch (err: any) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <BookOpen className="h-8 w-8 text-white -rotate-3" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          JIRVI EDU
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-300">
          E-Learning Management System
        </p>
        <p className="mt-2 text-center text-xs text-amber-300">
          Demo Mode. Admin: REG-ADMIN-2026
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-neutral-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-neutral-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
            <div>
              <label htmlFor="regNumber" className="block text-sm font-medium text-neutral-200">
                Registration Number
              </label>
              <div className="mt-1">
                <input
                  id="regNumber"
                  name="regNumber"
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-neutral-600 px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-neutral-900 text-white"
                  placeholder="e.g. REG-ADMIN-2026"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-200">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-neutral-600 px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-neutral-900 text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Sign in <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
