import React, { useState } from 'react';
import { BookOpen, AlertCircle, ArrowRight, Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { hash, compare } from 'bcrypt-ts';
import { authenticateStudent, authenticateTeacher } from '../lib/db';
import ThemeToggle from './ThemeToggle';
import { logActivity } from '../lib/activity-logger';
import { motion, AnimatePresence } from 'motion/react';
import loginCover from '../assets/images/login_cover_1786033509563.jpg';

export default function Login({ setRole }: { setRole: (role: string | null) => void }) {
  const [regNumber, setRegNumber] = useState(localStorage.getItem('jirvi_saved_reg') || '');
  const [password, setPassword] = useState(localStorage.getItem('jirvi_saved_password') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('jirvi_saved_reg') !== null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000;
    const lockoutKey = `lockout_${regNumber}`;
    const attemptsKey = `attempts_${regNumber}`;
    const lockoutTime = localStorage.getItem(lockoutKey);

    if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
      const minutesLeft = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
      setError(`Account locked. Try again in ${minutesLeft} minute(s).`);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('jirvi_saved_reg', regNumber);
      localStorage.setItem('jirvi_saved_password', password);
    } else {
      localStorage.removeItem('jirvi_saved_reg');
      localStorage.removeItem('jirvi_saved_password');
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
          setError('Account locked. Try again in 15 minutes.');
        } else {
          localStorage.setItem(attemptsKey, attempts.toString());
          setError(`Invalid admin credentials. (${MAX_ATTEMPTS - attempts} attempts left)`);
        }
        return;
      }
    }

    setLoading(true);
    try {
      let docSnap = null;
      let roleToSet = 'student';
      
      if (regNumber.startsWith('TEA-')) {
        docSnap = await authenticateTeacher(regNumber, password);
        roleToSet = 'teacher';
      } else {
        docSnap = await authenticateStudent(regNumber, password);
      }
      
      if (!docSnap) {
        const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(lockoutKey, (Date.now() + LOCKOUT_DURATION).toString());
          localStorage.removeItem(attemptsKey);
          setError('Account locked. Try again in 15 minutes.');
        } else {
          localStorage.setItem(attemptsKey, attempts.toString());
          setError(`Invalid credentials. (${MAX_ATTEMPTS - attempts} attempts left)`);
        }
        setLoading(false);
        return;
      } else {
        const userData = docSnap.data();
        sessionStorage.clear();
        sessionStorage.setItem('jirvi_student_reg', regNumber);
        sessionStorage.setItem('jirvi_student_id', docSnap.id);
        sessionStorage.setItem('jirvi_role', roleToSet);
        localStorage.removeItem(attemptsKey);
        localStorage.removeItem(lockoutKey);
        
        if (rememberMe) {
          localStorage.setItem('jirvi_student_reg', regNumber);
          localStorage.setItem('jirvi_student_id', docSnap.id);
          localStorage.setItem('jirvi_role', roleToSet);
        } else {
          localStorage.removeItem('jirvi_student_reg');
          localStorage.removeItem('jirvi_student_id');
          localStorage.removeItem('jirvi_role');
        }
        logActivity('Login', `${roleToSet === 'teacher' ? 'Teacher' : 'Student'} ${userData.fullName} logged in.`, regNumber, roleToSet);
        setRole(roleToSet);
      }
    } catch (err: any) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[var(--bg-app)]">
      {/* Decorative abstract elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen" />
      </div>
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1000px] bg-[var(--bg-card)] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[var(--border-subtle)] relative z-10"
      >
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative overflow-hidden text-white bg-slate-900">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginCover})` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">JIRVI EDU</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Unlock Your <br/>
              <span className="text-blue-200">Learning Potential</span>
            </h1>
            <p className="text-blue-100/80 text-lg max-w-sm">
              The premium e-learning platform designed to help you achieve academic excellence through interactive and personalized education.
            </p>
          </div>
          
          <div className="relative z-10">
            <div className="flex -space-x-4">
              <img className="w-10 h-10 rounded-full border-2 border-indigo-700" src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
              <img className="w-10 h-10 rounded-full border-2 border-indigo-700" src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
              <img className="w-10 h-10 rounded-full border-2 border-indigo-700" src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
              <div className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-bold">+2k</div>
            </div>
            <p className="mt-3 text-sm text-blue-100 font-medium">Join over 2,000+ students worldwide</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[var(--bg-card)]">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[var(--text-main)]">JIRVI EDU</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Welcome Back</h2>
            <p className="text-muted">Please sign in to your account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 flex items-start"
                >
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label htmlFor="regNumber" className="block text-sm font-semibold text-[var(--text-main)]">
                Registration Number
              </label>
              <div className="relative">
                <input
                  id="regNumber"
                  name="regNumber"
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-3 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all"
                  placeholder="REG-XXXX-XXXX"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--text-main)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-3 pr-12 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-[var(--text-main)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-[var(--border-strong)] rounded flex items-center justify-center bg-[var(--bg-app)] peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                    <motion.svg 
                      initial={false}
                      animate={rememberMe ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                      className="w-3.5 h-3.5 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--text-main)] group-hover:text-blue-600 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center py-3.5 px-4 rounded-xl border border-transparent bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8 overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted">
            <p>Access restricted to authorized students.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
