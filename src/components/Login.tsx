import React, { useState } from 'react';
import { BookOpen, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { hash, compare } from 'bcrypt-ts';
import { collection, query, where, getDocs, authenticateStudent } from '../lib/db';
import { db } from '../lib/db';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';
import { logActivity } from '../lib/activity-logger';

export default function Login({ setRole }: { setRole: (role: string | null) => void }) {
  const [regNumber, setRegNumber] = useState(localStorage.getItem('jirvi_saved_reg') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('jirvi_saved_reg') !== null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const lockoutKey = `lockout_${regNumber}`;
    const attemptsKey = `attempts_${regNumber}`;
    const lockoutTime = localStorage.getItem(lockoutKey);

    if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
      const minutesLeft = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
      setError(`Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('jirvi_saved_reg', regNumber);
    } else {
      localStorage.removeItem('jirvi_saved_reg');
    }

    if (regNumber === 'REG-ADMIN-2026') {
      const isValidAdmin = await compare(password, '$2b$10$dH1kydb21BVMDG/khog4velymZr.CYZ5eI8g8Byr79iMfdL5.dFAS');
      if (isValidAdmin) {
        sessionStorage.clear();
        sessionStorage.setItem('jirvi_role', 'admin');
        localStorage.removeItem(attemptsKey);
        localStorage.removeItem(lockoutKey);
        setRole('admin');
        logActivity('Login', 'Admin logged into the system', 'admin', 'admin');
        return;
      } else {
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(lockoutKey, (Date.now() + LOCKOUT_DURATION).toString());
          localStorage.removeItem(attemptsKey);
          setError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        } else {
          localStorage.setItem(attemptsKey, attempts.toString());
          setError(`Invalid admin credentials. (${MAX_ATTEMPTS - attempts} attempts remaining)`);
        }
        return;
      }
    }

    setLoading(true);
    try {
      const docSnap = await authenticateStudent(regNumber, password);
      
      if (!docSnap) {
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(lockoutKey, (Date.now() + LOCKOUT_DURATION).toString());
          localStorage.removeItem(attemptsKey);
          setError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        } else {
          localStorage.setItem(attemptsKey, attempts.toString());
          setError(`Invalid login credentials or student not found. (${MAX_ATTEMPTS - attempts} attempts remaining)`);
        }
        setLoading(false);
        return;
      } else {
        const studentData = docSnap.data();

        sessionStorage.clear();
        sessionStorage.setItem('jirvi_student_reg', regNumber);
        sessionStorage.setItem('jirvi_student_id', docSnap.id);
        sessionStorage.setItem('jirvi_role', 'student');
        localStorage.removeItem(attemptsKey);
        localStorage.removeItem(lockoutKey);
        
        if (rememberMe) {
          localStorage.setItem('jirvi_student_reg', regNumber);
          localStorage.setItem('jirvi_student_id', docSnap.id);
          localStorage.setItem('jirvi_role', 'student');
        } else {
          localStorage.removeItem('jirvi_student_reg');
          localStorage.removeItem('jirvi_student_id');
          localStorage.removeItem('jirvi_role');
        }
        logActivity('Login', `Student ${studentData.fullName} logged in.`, regNumber, 'student');
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
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-neutral-950 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/80 to-neutral-950" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 -left-64 w-[600px] h-[600px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 -right-64 w-[600px] h-[600px] bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-50"></div>
      
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all duration-500">
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150"></div>
          <div className="h-16 w-16 bg-blue-600/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] transform rotate-3 border border-blue-400/30 relative z-10">
            <BookOpen className="h-8 w-8 text-white -rotate-3" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tighter text-white drop-shadow-md">
          JIRVI EDU
        </h2>
        <p className="mt-3 text-center text-sm font-medium text-indigo-200/80 tracking-wide uppercase">
          E-Learning Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-neutral-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-neutral-700/50">
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
                  className="block w-full appearance-none rounded-lg border border-neutral-600/50 px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-neutral-900/50 backdrop-blur-sm text-neutral-50 transition-colors"
                  placeholder="REG-XXXX-XXXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-200">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-neutral-600/50 px-3 py-2 pr-10 placeholder-neutral-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-neutral-900/50 backdrop-blur-sm text-neutral-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-neutral-900"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-300">
                Remember me
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600/80 backdrop-blur-md py-3 px-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-50 mt-4 outline outline-1 outline-indigo-500/50"
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
