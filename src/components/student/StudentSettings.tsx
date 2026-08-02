import React, { useState } from 'react';
import { hash, compare } from 'bcrypt-ts';
import { db, storage } from '../../lib/db';
import { doc, updateDoc, authenticateStudent } from '../../lib/db';
import { ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Loader2, Camera, Mail, Lock, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { Student } from '../../types';
import { isStrongPassword } from '../../lib/security';

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
    return <div className="p-8 text-center text-neutral-400">Loading student details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">Account Settings</h1>
        <p className="text-neutral-400">Update your profile, change your email and password.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-inner bg-neutral-800 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-blue-400 font-bold">{student.fullName.charAt(0)}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-neutral-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-8 h-8 text-neutral-50" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>
            <h3 className="font-bold text-neutral-50 text-lg">{student.fullName}</h3>
            <p className="text-sm text-neutral-400 font-medium">{student.regNumber}</p>
            <div className="mt-4 w-full flex flex-col space-y-2 text-sm text-left">
              <div className="flex justify-between border-b border-neutral-50 pb-2">
                <span className="text-neutral-400">Course</span>
                <span className="font-medium text-neutral-50">{student.course}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-50 pb-2">
                <span className="text-neutral-400">Status</span>
                <span className="font-medium text-green-600 capitalize">{student.status}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-neutral-400">Joined</span>
                <span className="font-medium text-neutral-50">{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" /> {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 p-3 rounded-lg flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" /> {success}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center"><Mail className="w-5 h-5 mr-2 text-neutral-400" /> Contact Information</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-black text-neutral-50 border border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-50 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-neutral-400" /> Security</h3>
                <div className="space-y-4">
                  {(email !== student.email && email !== '') || password ? (
                    <div>
                      <label className="block text-sm font-medium text-neutral-200 mb-1">Current Password (Required for changes)</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-2 bg-black text-neutral-50 border border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  ) : null}
                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-1">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 bg-black text-neutral-50 border border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-200 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 bg-black text-neutral-50 border border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-900 px-6 py-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition flex items-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
