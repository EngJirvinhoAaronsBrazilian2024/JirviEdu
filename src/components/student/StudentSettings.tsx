import React, { useState } from 'react';
import { hash } from 'bcrypt-ts';
import { db, storage } from '../../lib/db';
import { doc, updateDoc, authenticateStudent } from '../../lib/db';
import { ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Loader2, Camera, Mail, Lock, CheckCircle, AlertCircle, Save, User, ShieldCheck } from 'lucide-react';
import { Student } from '../../types';
import { isStrongPassword } from '../../lib/security';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function StudentSettings({ student, studentId }: { student: Student | null, studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(student?.photoUrl || '');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !student) {
      setError('Cannot edit student profile. Invalid student ID.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password && !isStrongPassword(password)) {
      setError('New password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const emailChanged = email && email !== student.email;
      const passwordChanged = !!password;
      
      if (emailChanged || passwordChanged) {
        if (!currentPassword) {
          setError('Current password is required to save changes to email or password.');
          setLoading(false);
          return;
        }
        
        const auth = await authenticateStudent(student.regNumber, currentPassword);
        if (!auth) {
          setError('Current password is incorrect.');
          setLoading(false);
          return;
        }
      }

      const updates: any = {};
      
      if (emailChanged) {
        updates.email = email;
      }
      if (passwordChanged) {
        updates.password = await hash(password, 10);
      }
      if (photo) {
        const photoRef = ref(storage, `students/${studentId}/photo`);
        await uploadBytes(photoRef, photo);
        updates.photoUrl = await getDownloadURL(photoRef);
      }

      if (Object.keys(updates).length > 0) {
        const docRef = doc(db, 'students', studentId);
        await updateDoc(docRef, updates);
        setSuccess('Profile updated successfully! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSuccess('No changes to save.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[var(--text-main)] font-semibold">Loading profile...</p>
      </div>
    );
  }

  const isEmailChanged = email && email !== student.email;
  const isPasswordChanged = !!password;
  const requiresCurrentPassword = isEmailChanged || isPasswordChanged;
  const hasUnsavedChanges = photo || isEmailChanged || isPasswordChanged;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
          <User className="w-8 h-8 mr-3 text-blue-500" />
          Profile Settings
        </h1>
        <p className="mt-2 text-muted font-medium">Manage your personal information, avatar, and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10" />
            
            <div className="relative group cursor-pointer mb-6 z-10 mt-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--bg-card)] shadow-xl bg-[var(--bg-app)] flex items-center justify-center transition-transform group-hover:scale-105">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl text-blue-500 font-bold">{student.fullName.charAt(0)}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm border-4 border-transparent">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h3 className="font-bold text-[var(--text-main)] text-2xl tracking-tight z-10">{student.fullName}</h3>
            <p className="text-sm font-bold text-muted uppercase tracking-wider mt-1 mb-6 z-10 bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border-subtle)]">{student.regNumber}</p>
            
            <div className="w-full flex flex-col space-y-3 text-sm text-left z-10">
              <div className="flex justify-between items-center bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="font-bold text-muted uppercase tracking-wider text-xs">Program</span>
                <span className="font-bold text-[var(--text-main)] text-right max-w-[150px] truncate">{student.course}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="font-bold text-muted uppercase tracking-wider text-xs">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                  {student.status}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="font-bold text-muted uppercase tracking-wider text-xs">Joined</span>
                <span className="font-bold text-[var(--text-main)]">{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <form onSubmit={handleSave} className="premium-card overflow-hidden">
              <div className="p-6 md:p-8 space-y-8">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl flex items-center text-red-600 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-500/20 shadow-sm"
                    >
                      <AlertCircle className="w-5 h-5 mr-3 shrink-0" /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="bg-green-50 dark:bg-green-500/10 p-4 rounded-xl flex items-center text-green-600 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-500/20 shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5 mr-3 shrink-0" /> {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-5 flex items-center border-b border-[var(--border-subtle)] pb-3">
                    <Mail className="w-5 h-5 mr-3 text-blue-500" /> 
                    Contact Details
                  </h3>
                  <div className="space-y-1.5 max-w-xl">
                    <label className="block text-sm font-bold text-[var(--text-main)]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      placeholder={student.email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-3 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] font-medium transition-all shadow-sm"
                    />
                    <p className="text-xs font-semibold text-muted mt-1">We'll use this for important academic communications.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-5 flex items-center border-b border-[var(--border-subtle)] pb-3">
                    <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" /> 
                    Security Settings
                  </h3>
                  <div className="space-y-5 max-w-xl">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-[var(--text-main)]">New Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-3 placeholder:text-muted focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-main)] bg-[var(--bg-app)] font-medium transition-all shadow-sm"
                      />
                    </div>
                    <AnimatePresence>
                      {password && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          <label className="block text-sm font-bold text-[var(--text-main)]">Confirm New Password</label>
                          <input
                            type="password"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={clsx(
                              "block w-full rounded-xl border px-4 py-3 placeholder:text-muted focus:outline-none focus:ring-4 font-medium transition-all shadow-sm bg-[var(--bg-app)] text-[var(--text-main)]",
                              confirmPassword && password !== confirmPassword 
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" 
                                : confirmPassword && password === confirmPassword
                                  ? "border-green-500 focus:border-green-500 focus:ring-green-500/10"
                                  : "border-[var(--border-strong)] focus:border-emerald-500 focus:ring-emerald-500/10"
                            )}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {requiresCurrentPassword && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="pt-4 border-t border-[var(--border-subtle)] overflow-hidden"
                        >
                          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-5 rounded-xl">
                            <label className="block text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center">
                              <Lock className="w-4 h-4 mr-2" />
                              Current Password Required
                            </label>
                            <p className="text-xs text-amber-700 dark:text-amber-500 font-medium mb-3">
                              To save changes to your email or password, please verify your identity.
                            </p>
                            <input
                              type="password"
                              required={requiresCurrentPassword}
                              placeholder="Enter your current password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="block w-full rounded-xl border border-amber-300 dark:border-amber-500/30 px-4 py-3 placeholder:text-amber-700/50 dark:placeholder:text-amber-500/50 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 text-[var(--text-main)] bg-white dark:bg-amber-900/10 font-medium transition-all shadow-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--bg-app)] border-t border-[var(--border-subtle)] px-6 py-4 md:px-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !hasUnsavedChanges}
                  className={clsx(
                    "px-6 py-2.5 rounded-xl font-bold flex items-center transition-all shadow-sm",
                    hasUnsavedChanges
                      ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                      : "bg-[var(--bg-card)] text-muted border border-[var(--border-strong)] cursor-not-allowed opacity-70"
                  )}
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
