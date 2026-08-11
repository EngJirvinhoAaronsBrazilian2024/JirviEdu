import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Video, FileText, Settings, LogOut, Menu, X, FileDown, Activity, GraduationCap, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

import AdminModules from './admin/AdminModules';
import AdminLectures from './admin/AdminLectures';
import AdminAssignments from './admin/AdminAssignments';
import AdminMaterials from './admin/AdminMaterials';
import Timetable from './Timetable';
import TeacherDashboard from './teacher/TeacherDashboard';
import { db, doc, getDoc } from '../lib/db';
import { Teacher } from '../types';

export default function TeacherPortal({ setRole }: { setRole: (role: string | null) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const teacherId = sessionStorage.getItem('jirvi_student_id') || localStorage.getItem('jirvi_student_id');

  useEffect(() => {
    if (teacherId) {
      getDoc(doc(db, 'teachers', teacherId)).then(snap => {
        if (snap.exists()) {
          setTeacher({ id: snap.id, ...snap.data() } as Teacher);
        }
      });
    }
  }, [teacherId]);

  const handleLogout = () => {
    setRole(null);
    sessionStorage.clear();
    localStorage.removeItem('jirvi_student_id');
    localStorage.removeItem('jirvi_student_reg');
    localStorage.removeItem('jirvi_role');
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { name: 'Modules', href: '/teacher/modules', icon: BookOpen },
    { name: 'Lectures', href: '/teacher/lectures', icon: Video },
    { name: 'Assignments', href: '/teacher/assignments', icon: FileText },
    { name: 'Timetable', href: '/teacher/timetable', icon: Calendar },
    { name: 'Materials', href: '/teacher/materials', icon: FileDown },
  ];

  // We can just reuse Admin components, but they need to be filtered by assignedModules.
  // Wait, Admin components currently fetch ALL modules. 
  // If we just pass `teacherId` or `assignedModules` to them, they can filter. 
  // Let's modify Admin components to accept `assignedModules?: string[]`.

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex print:block">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden print:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)} 
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-[var(--bg-card)] border-r border-[var(--border-strong)] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">Teacher</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-muted hover:text-[var(--text-main)] p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-strong)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all',
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-muted hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'
                      )}
                    >
                      <item.icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-muted')} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                <div className="flex items-center mb-4 px-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mr-3 shadow-inner">
                    {teacher?.fullName?.charAt(0) || 'T'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-[var(--text-main)] truncate">{teacher?.fullName || 'Teacher'}</p>
                    <p className="text-xs text-muted font-medium truncate">{teacher?.email || 'Teacher Portal'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-[var(--bg-card)] border-r border-[var(--border-strong)] z-40 print:hidden shadow-lg">
        <div className="p-6 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">Teacher</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all',
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-muted hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'
                )}
              >
                <item.icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-muted')} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mr-3 shadow-inner">
              {teacher?.fullName?.charAt(0) || 'T'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[var(--text-main)] truncate">{teacher?.fullName || 'Teacher'}</p>
              <p className="text-xs text-muted font-medium truncate">{teacher?.email || 'Teacher Portal'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-red-100 dark:border-red-900/30"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign out
          </button>
        </div>
      </div>

      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-strong)] print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted hover:text-[var(--text-main)] lg:hidden bg-[var(--bg-card)] rounded-xl border border-[var(--border-strong)]"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:hidden flex justify-center">
            <span className="font-bold text-lg text-[var(--text-main)]">JIRVI EDU</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            {teacher?.id && <NotificationBell userId={teacher.id} />}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<TeacherDashboard teacher={teacher} />} />
                <Route path="/modules" element={<AdminModules assignedModules={teacher?.assignedModules} />} />
                <Route path="/lectures" element={<AdminLectures assignedModules={teacher?.assignedModules} />} />
                <Route path="/assignments" element={<AdminAssignments assignedModules={teacher?.assignedModules} />} />
                <Route path="/timetable" element={<Timetable assignedModules={teacher?.assignedModules} />} />
                <Route path="/materials" element={<AdminMaterials assignedModules={teacher?.assignedModules} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
