import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { 
  LayoutDashboard, BookOpen, Video, FileText, 
  Calendar, FileDown, LogOut, Menu, X, Bell
} from 'lucide-react';
import clsx from 'clsx';
import { Student, Module } from '../types';

import StudentModules from './student/StudentModules';
import StudentLectures from './student/StudentLectures';
import StudentAssignments from './student/StudentAssignments';
import StudentMaterials from './student/StudentMaterials';
import StudentResults from './student/StudentResults';
import { Award } from 'lucide-react';

export default function StudentPortal({ setRole }: { setRole: (role: string | null) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchStudent = async () => {
      const studentId = localStorage.getItem('jirvi_student_id');
      const regNumber = localStorage.getItem('jirvi_student_reg') || 'Unknown';
      
      if (studentId && studentId !== 'mock_student_1') {
        try {
          const docRef = doc(db, 'students', studentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
          } else {
            // Fallback
            setStudent({
              id: studentId,
              regNumber: regNumber,
              fullName: 'Demo Student',
              email: 'demo@student.jirvi.edu',
              course: 'Demo Course',
              status: 'active',
              createdAt: Date.now()
            } as Student);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback mock
        setStudent({
          id: 'mock_student_1',
          regNumber: regNumber,
          fullName: 'Demo Student',
          email: 'demo@student.jirvi.edu',
          course: 'Demo Course',
          status: 'active',
          createdAt: Date.now()
        } as Student);
      }
      setLoading(false);
    };
    
    fetchStudent();
  }, []);

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('jirvi_student_reg');
    localStorage.removeItem('jirvi_student_id');
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Modules', href: '/student/modules', icon: BookOpen },
    { name: 'Lectures', href: '/student/lectures', icon: Video },
    { name: 'Assignments', href: '/student/assignments', icon: FileText },
    { name: 'Results', href: '/student/results', icon: Award },
    { name: 'Timetable', href: '/student/timetable', icon: Calendar },
    { name: 'Materials', href: '/student/materials', icon: FileDown },
  ];

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex print:block print:bg-white">
      {/* Mobile sidebar */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden print:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              JIRVI EDU
            </span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const current = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    current ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
              <LogOut className="mr-3 h-5 w-5 text-slate-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-slate-900 overflow-hidden lg:border-r lg:border-slate-800 print:hidden">
        <div className="flex items-center h-16 px-6 bg-slate-900/50">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            JIRVI EDU
          </span>
        </div>
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-xl font-bold text-indigo-400 shadow-inner">
            {student?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{student?.fullName || 'Student'}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{student?.regNumber || 'Not Registered'}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const current = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  current ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all'
                )}
              >
                <item.icon className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-slate-500" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100 print:pl-0 print:bg-white print:bg-none">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/50 backdrop-blur-md border-b border-slate-200/60 lg:hidden px-4 justify-between items-center print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-slate-900 tracking-tight">JIRVI EDU</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<StudentDashboard student={student} />} />
            <Route path="/modules" element={<StudentModules studentId={student?.id || ''} />} />
            <Route path="/lectures" element={<StudentLectures studentId={student?.id || ''} />} />
            <Route path="/assignments" element={<StudentAssignments studentId={student?.id || ''} />} />
            <Route path="/results" element={<StudentResults studentId={student?.id || ''} />} />
            <Route path="/timetable" element={<div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-neutral-200"><h2 className="text-xl font-bold mb-2">My Timetable</h2><p className="text-neutral-500">Your timetable is automatically constructed from your upcoming scheduled lectures. Visit the Lectures tab to join classes.</p></div>} />
            <Route path="/materials" element={<StudentMaterials studentId={student?.id || ''} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function StudentDashboard({ student }: { student: Student | null }) {
  const [lectures, setLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id || student.id === 'mock_student_1') {
      setLoading(false);
      return;
    }

    const fetchLectures = async () => {
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

        const allLecs: {mod: Module, lec: any}[] = [];
        for (const m of mods) {
          const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
          lecsSnap.docs.forEach(d => {
            allLecs.push({ mod: m, lec: { id: d.id, ...d.data() } });
          });
        }

        // Sort by date/time
        allLecs.sort((a,b) => {
          const dateA = new Date(`${a.lec.date}T${a.lec.time}`).getTime();
          const dateB = new Date(`${b.lec.date}T${b.lec.time}`).getTime();
          return dateA - dateB;
        });

        // Filter only upcoming or today
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const upcoming = allLecs.filter(l => {
          const lDate = new Date(`${l.lec.date}T${l.lec.time}`);
          return lDate.getTime() >= now.getTime();
        });

        setLectures(upcoming.slice(0, 3)); // Top 3
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [student]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {student?.fullName?.split(' ')[0] || 'Student'}!</h1>
        <p className="mt-2 text-slate-500">Here's a summary of your academic activities for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5 col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3">
              <Video className="w-5 h-5 text-indigo-500"/>
            </div>
            Upcoming Lectures
          </h2>
          
          {loading ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
              Loading lectures...
            </div>
          ) : lectures.length > 0 ? (
            <div className="space-y-4">
              {lectures.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4">
                      <Video className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.lec.title}</h3>
                      <p className="text-sm font-medium text-slate-500">{item.mod.code} • <span className="text-indigo-600">{item.lec.date} at {item.lec.time}</span></p>
                    </div>
                  </div>
                  <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Join Class</a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-500 border-dashed">
              No upcoming lectures scheduled.
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white p-6 md:p-8 rounded-3xl border border-amber-100 shadow-sm ring-1 ring-slate-900/5">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-amber-500"/>
            </div>
            Announcements
          </h2>
          <div className="bg-white rounded-2xl border border-amber-100/50 p-5 shadow-sm">
            <p className="text-sm font-bold text-amber-900 mb-1">Welcome to JIRVI EDU</p>
            <p className="text-sm text-amber-700/80 leading-relaxed">Please make sure to check your enrolled modules for required materials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
