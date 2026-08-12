import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { hash, compare } from 'bcrypt-ts';
import { db } from '../lib/db';
import { collection, getDocs, doc, setDoc, deleteDoc, query, onSnapshot } from '../lib/db';
import { 
  LayoutDashboard, Users, BookOpen, Video, FileText, 
  Settings, LogOut, Menu, X, Calendar, FileDown, Plus, Activity, Search, Upload
} from 'lucide-react';
import clsx from 'clsx';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Student, Module } from '../types';
import StudentPerformance from './admin/StudentPerformance';
import { isStrongPassword } from '../lib/security';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap } from 'lucide-react';

import AdminModules from './admin/AdminModules';
import AdminLectures from './admin/AdminLectures';
import AdminAssignments from './admin/AdminAssignments';
import AdminMaterials from './admin/AdminMaterials';
import NotificationBell from './NotificationBell';
import AdminActivityLogs from './admin/AdminActivityLogs';
import TeacherManagement from './admin/TeacherManagement';
import Timetable from './Timetable';
import { GraduationCap } from 'lucide-react';

export default function AdminPortal({ setRole }: { setRole: (role: string | null) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('jirvi_role');
    localStorage.removeItem('jirvi_student_reg');
    localStorage.removeItem('jirvi_student_id');
    setRole(null);
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
    { name: 'Modules', href: '/admin/modules', icon: BookOpen },
    { name: 'Lectures', href: '/admin/lectures', icon: Video },
    { name: 'Assignments', href: '/admin/assignments', icon: FileText },
    { name: 'Timetable', href: '/admin/timetable', icon: Calendar },
    { name: 'Materials', href: '/admin/materials', icon: FileDown },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  ];

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
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-700 dark:bg-[#1a1a1a] text-white flex flex-col shadow-2xl border-r border-slate-600 dark:border-[var(--border-subtle)]"
            >
              <div className="flex items-center justify-between h-20 px-6 border-b border-slate-600 dark:border-[var(--border-subtle)]">
                <span className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 border border-blue-400/20 shadow-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
                  JIRVI ADMIN
                </span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-300 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const current = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        current ? 'bg-slate-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-600 hover:text-white font-medium',
                        'group flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200'
                      )}
                    >
                      <item.icon className={clsx('mr-4 flex-shrink-0 h-5 w-5', current ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-slate-600 dark:border-[var(--border-subtle)]">
                <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm">
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-slate-700 dark:bg-[#1a1a1a] text-white overflow-hidden lg:border-r border-slate-600 dark:border-[var(--border-subtle)] shadow-sm print:hidden z-20">
        <div className="flex items-center h-20 px-8">
          <span className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 border border-blue-400/20 shadow-sm"><GraduationCap className="w-6 h-6 text-white" /></div>
            JIRVI ADMIN
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const current = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  current ? 'bg-slate-600 text-white font-semibold shadow-sm border border-slate-500' : 'text-slate-300 hover:bg-slate-600 hover:text-white font-medium border border-transparent',
                  'group flex items-center px-4 py-3.5 text-sm rounded-xl transition-all duration-200 relative overflow-hidden'
                )}
              >
                {current && <motion.div layoutId="activeAdminNav" className="absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full" />}
                <item.icon className={clsx('mr-4 flex-shrink-0 h-5 w-5 z-10 relative', current ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                <span className="z-10 relative">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-600 dark:border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 cursor-pointer p-2 rounded-xl border border-transparent hover:border-slate-500 hover:bg-slate-600 transition-all mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none mb-1">Administrator</p>
              <p className="text-xs text-slate-300 leading-none font-medium">System Manager</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm">
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen relative z-10 w-full overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-4 sm:px-6 lg:px-8 justify-between items-center shadow-sm print:hidden">
          <div className="flex items-center lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-muted hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-app)] transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-between lg:justify-end gap-4 lg:gap-6 ml-4 lg:ml-0">
            {/* Desktop Search */}
            <div className="hidden lg:flex flex-1 max-w-md relative mr-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-[var(--border-strong)] rounded-xl leading-5 bg-[var(--bg-app)] text-[var(--text-main)] placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all sm:text-sm shadow-inner"
                placeholder="Search students, courses..."
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <ThemeToggle />
              <NotificationBell userId="admin" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/teachers" element={<TeacherManagement />} />
                <Route path="/modules" element={<AdminModules />} />
                <Route path="/lectures" element={<AdminLectures />} />
                <Route path="/assignments" element={<AdminAssignments />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/materials" element={<AdminMaterials />} />
                <Route path="/activity-logs" element={<AdminActivityLogs />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    modules: 0,
    assignments: 0,
    lectures: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});
  const [gradeData, setGradeData] = useState<{name: string, average: number}[]>([]);
  const [submissionData, setSubmissionData] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      let stCount = 0;
      let mCount = 0;
      let assignmentsCount = 0;
      let lecturesCount = 0;
      const allSubs: any[] = [];
      const modGrades: Record<string, {total: number, count: number}> = {};
      let onTimeCount = 0;
      let lateCount = 0;

      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        stCount = studentsSnap.docs.length;
        const sMap: Record<string, string> = {};
        studentsSnap.docs.forEach(d => {
          sMap[d.id] = (d.data() as unknown as Record<string, any>).fullName || 'Unknown Student';
        });
        setStudentsMap(sMap);
      } catch (err) {
        console.error("Failed to fetch students in dashboard", err);
      }

      try {
        const modulesSnap = await getDocs(collection(db, 'modules'));
        mCount = modulesSnap.docs.length;
        
        for (const modDoc of modulesSnap.docs) {
          const modData = modDoc.data() as any;
          modGrades[modData.code] = { total: 0, count: 0 };
          
          try {
            const [assignmentsSnap, lecturesSnap] = await Promise.all([
              getDocs(collection(db, `modules/${modDoc.id}/assignments`)).catch(() => ({ docs: [] })),
              getDocs(collection(db, `modules/${modDoc.id}/lectures`)).catch(() => ({ docs: [] }))
            ]);
            
            assignmentsCount += assignmentsSnap.docs.length;
            lecturesCount += lecturesSnap.docs.length;

            for (const aDoc of assignmentsSnap.docs) {
              const aData = aDoc.data() as any;
              try {
                const subsSnap = await getDocs(collection(db, `modules/${modDoc.id}/assignments/${aDoc.id}/submissions`));
                const mappedSubs = subsSnap.docs.map(subDoc => {
                  const subData = subDoc.data() as any;
                  
                  // Grade calc
                  if (subData.grade !== undefined && aData.marks) {
                     const pct = (Number(subData.grade) / Number(aData.marks)) * 100;
                     if (!isNaN(pct)) {
                        modGrades[modData.code].total += pct;
                        modGrades[modData.code].count += 1;
                     }
                  }

                  // Late calc (simplified: check if submittedAt > aData.dueDate, assuming dueDate is timestamp)
                  if (aData.dueDate) {
                     const dueTime = new Date(aData.dueDate).getTime();
                     if (subData.submittedAt > dueTime) {
                        lateCount++;
                     } else {
                        onTimeCount++;
                     }
                  } else {
                     onTimeCount++; // if no due date, it's on time
                  }

                  return {
                    id: subDoc.id,
                    assignmentTitle: aData.title,
                    moduleCode: modData.code,
                    totalMarks: aData.marks,
                    ...subData
                  };
                });
                allSubs.push(...mappedSubs);
              } catch (subErr) {
                console.error("Failed fetching submissions for assignment", aDoc.id, subErr);
              }
            }
          } catch (err) {
            console.error("Failed fetching assignments/lectures for module", modDoc.id, err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch modules in dashboard", err);
      }

      try {
        allSubs.sort((a,b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        setAllSubmissions(allSubs);
        setRecentSubmissions(allSubs.slice(0, 10)); // Top 10 most recent

        const gd = Object.keys(modGrades).map(code => ({
           name: code,
           average: modGrades[code].count > 0 ? Math.round(modGrades[code].total / modGrades[code].count) : 0
        })).filter(g => g.average > 0); // Only show modules with grades
        setGradeData(gd);

        setSubmissionData([
           { name: 'On Time', count: onTimeCount },
           { name: 'Late', count: lateCount }
        ]);

        setStats({
          students: stCount,
          modules: mCount,
          assignments: assignmentsCount,
          lectures: lecturesCount
        });
      } catch (err) {
        console.error("Failed closing stats setup", err);
      }
    };
    fetchStats();
    
    import('../lib/db').then((dbModule) => {
       if (dbModule.mutationEmitter) {
          const unsub = dbModule.mutationEmitter.subscribe(() => {
             fetchStats();
          });
          return unsub;
       }
    });
  }, []);

  const importCSVRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) return; // Skip header

      const students = lines.slice(1).map(line => {
        const [regNumber, fullName, email, course] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          regNumber,
          fullName,
          email,
          course,
          status: 'active',
          createdAt: Date.now()
        };
      });

      let added = 0;
      for (const student of students) {
        if (!student.regNumber || !student.fullName) continue;
        try {
          await setDoc(doc(db, 'students', student.id), student);
          added++;
        } catch (err) {
          console.error("Failed to add student from CSV", err);
        }
      }
      alert(`Imported ${added} students successfully!`);
      if (importCSVRef.current) importCSVRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportGradesCSV = () => {
    const csvRows = [
      ['Student Name', 'Module Code', 'Assignment', 'Grade', 'Total Marks', 'Submitted At']
    ];
    
    allSubmissions.forEach(sub => {
      const stName = studentsMap[sub.studentId] || studentsMap[sub.id] || sub.studentId || sub.id || 'Unknown';
      const grade = sub.grade !== undefined ? sub.grade : 'N/A';
      const date = sub.submittedAt ? new Date(sub.submittedAt).toISOString() : 'N/A';
      csvRows.push([
        `"${stName}"`,
        `"${sub.moduleCode || ''}"`,
        `"${(sub.assignmentTitle || '').replace(/"/g, '""')}"`,
        `"${grade}"`,
        `"${sub.totalMarks || ''}"`,
        `"${date}"`
      ]);
    });
    
    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_grades_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceData = [
    { name: 'Mon', attendance: 95 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 92 },
    { name: 'Thu', attendance: 85 },
    { name: 'Fri', attendance: 90 },
  ];

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!announcementTitle || !announcementMessage) return;
    setIsBroadcasting(true);
    try {
      let finalMessage = announcementMessage;
      // Auto-summarize if it's long (>100 chars)
      if (announcementMessage.length > 100) {
        try {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: announcementMessage })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.summary) {
              finalMessage = data.summary;
            }
          }
        } catch (summaryErr) {
          console.error("Summary error", summaryErr);
        }
      }

      const notifId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'notifications', notifId), {
        userId: 'all',
        title: announcementTitle,
        message: finalMessage,
        read: false,
        createdAt: Date.now()
      });
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      alert('Announcement sent successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to send announcement');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">System Overview</h1>
          <p className="mt-2 text-muted font-medium">Manage your educational institution effectively.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={importCSVRef}
            onChange={handleImportCSV}
            className="hidden"
          />
          <button 
            onClick={() => importCSVRef.current?.click()}
            className="flex items-center px-4 py-2 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-bold text-[var(--text-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Students
          </button>
          <button 
            onClick={exportGradesCSV}
            className="flex items-center px-4 py-2 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-bold text-[var(--text-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export All Grades
          </button>
        </div>
      </div>
      
      {/* Quick Announcement */}
      <div className="premium-card p-6 md:p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
          <Activity className="w-5 h-5 text-indigo-500 mr-3" />
          Broadcast Announcement
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Announcement Title..." 
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="flex-1 rounded-xl border border-[var(--border-strong)] px-4 py-2 bg-[var(--bg-app)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <input 
            type="text" 
            placeholder="Message..." 
            value={announcementMessage}
            onChange={(e) => setAnnouncementMessage(e.target.value)}
            className="flex-[2] rounded-xl border border-[var(--border-strong)] px-4 py-2 bg-[var(--bg-app)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button 
            onClick={handleBroadcast}
            disabled={!announcementTitle || !announcementMessage || isBroadcasting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold transition-colors"
          >
            {isBroadcasting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 md:p-8 lg:col-span-2">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-8 flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-3" />
            Key Metrics
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-orange-400 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
              <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
                <div className="flex items-center justify-center w-1/3">
                  <Users className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
                  <span className="text-4xl font-bold tracking-tight text-white">{stats.students}</span>
                  <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider">Students</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
              <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
                <div className="flex items-center justify-center w-1/3">
                  <BookOpen className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
                  <span className="text-4xl font-bold tracking-tight text-white">{stats.modules}</span>
                  <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider">Modules</p>
                </div>
              </div>
            </div>

            <div className="bg-pink-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
              <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
                <div className="flex items-center justify-center w-1/3">
                  <FileText className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
                  <span className="text-4xl font-bold tracking-tight text-white">{stats.assignments}</span>
                  <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider">Assignments</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
              <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
                <div className="flex items-center justify-center w-1/3">
                  <Video className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
                  <span className="text-4xl font-bold tracking-tight text-white">{stats.lectures}</span>
                  <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider">Lectures</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="premium-card p-6 md:p-8 lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
            Weekly Attendance
          </h2>
          <div className="flex-1 w-full min-h-[300px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--border-subtle)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value}%`, 'Attendance']}
                />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-6 md:p-8 flex flex-col">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
            Average Grade by Module
          </h2>
          <div className="flex-1 w-full min-h-[300px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} dx={-10} domain={[0, 100]} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--border-subtle)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value}%`, 'Avg Grade']}
                />
                <Bar dataKey="average" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-6 md:p-8 flex flex-col">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
            Assignment Submission Rates
          </h2>
          <div className="flex-1 w-full min-h-[300px] mt-2">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={submissionData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   paddingAngle={5}
                   dataKey="count"
                 >
                   {submissionData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                   itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                 />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="premium-card p-6 md:p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Recent Submissions</h2>
          <span className="text-sm font-semibold bg-[var(--bg-app)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-full text-[var(--text-main)]">{recentSubmissions.length} recent</span>
        </div>
        
        {recentSubmissions.length === 0 ? (
           <div className="py-12 text-center text-muted flex flex-col items-center">
             <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                <FileText className="w-8 h-8 text-muted opacity-50" />
             </div>
             <p className="font-medium text-[var(--text-main)]">No submissions found</p>
             <p className="text-sm mt-1">When students submit work, it will appear here.</p>
           </div>
        ) : (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="inline-block min-w-full align-middle md:px-0 px-6">
              <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                <thead>
                  <tr>
                    <th scope="col" className="py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Student</th>
                    <th scope="col" className="py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Assignment</th>
                    <th scope="col" className="py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th scope="col" className="py-4 text-right text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {recentSubmissions.map((sub, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-app)] transition-colors group cursor-default">
                      <td className="py-5 whitespace-nowrap text-sm hidden sm:table-cell">
                        <div className="font-semibold text-[var(--text-main)] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shadow-inner">
                             {(studentsMap[sub.studentId] || studentsMap[sub.id] || sub.studentId || sub.id).charAt(0)}
                          </div>
                          {studentsMap[sub.studentId] || studentsMap[sub.id] || sub.studentId || sub.id}
                        </div>
                      </td>
                      <td className="py-5 whitespace-nowrap text-sm text-[var(--text-main)]">
                        <div className="flex flex-col">
                          <span className="font-bold">{sub.assignmentTitle}</span>
                          <span className="text-xs text-muted font-medium mt-0.5">{sub.moduleCode}</span>
                        </div>
                      </td>
                      <td className="py-5 whitespace-nowrap text-sm hidden sm:table-cell">
                         {sub.grade !== undefined ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">Graded</span>
                         ) : (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm">Needs Grading</span>
                         )}
                      </td>
                      <td className="py-5 whitespace-nowrap text-sm text-right text-muted font-medium hidden sm:table-cell">
                        {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReg, setNewReg] = useState('');
  const [newName, setNewName] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewingPerformance, setViewingPerformance] = useState<Student | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewReg('');
    setNewName('');
    setNewCourse('');
    setNewPassword('');
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    setNewReg(student.regNumber);
    setNewName(student.fullName);
    setNewCourse(student.course);
    setNewPassword('');
    setModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    if ((!editingId || newPassword) && !isStrongPassword(newPassword)) {
      setErrorMsg('Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.');
      setCreating(false);
      return;
    }

    try {
      const email = `${newReg.toLowerCase().replace(/\s+/g, '')}@student.jirvi.edu`;
      const uid = editingId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

      const studentData: any = {
        regNumber: newReg,
        fullName: newName,
        email: email,
        course: newCourse,
        status: 'active',
      };

      if (!editingId) {
        studentData.createdAt = Date.now();
        studentData.password = await hash(newPassword, 10);
      } else {
        const existing = students.find(s => s.id === editingId);
        studentData.createdAt = existing?.createdAt || Date.now();
        if (newPassword) {
          studentData.password = await hash(newPassword, 10);
        } else {
          delete studentData.password;
        }
      }

      await setDoc(doc(db, 'students', uid), studentData, { merge: true });

      setStudents(prev => {
        if (editingId) {
          return prev.map(s => s.id === uid ? { ...s, ...studentData } : s);
        } else {
          return [...prev, { id: uid, ...studentData } as Student];
        }
      });

      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Error saving student. See console.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {viewingPerformance && (
        <StudentPerformance 
          student={viewingPerformance} 
          onClose={() => setViewingPerformance(null)} 
        />
      )}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
            onClick={() => setModalOpen(false)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="premium-card w-full max-w-md flex flex-col relative z-10 max-h-[90vh]"
          >
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-card)] rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-[var(--text-main)]">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-[var(--text-main)] transition-colors p-2 rounded-full hover:bg-[var(--bg-app)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-5 overflow-y-auto">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[var(--text-main)]">Registration Number</label>
                <input required value={newReg} onChange={e=>setNewReg(e.target.value)} type="text" className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" placeholder="REG-XXXX-XXXX" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[var(--text-main)]">Full Name</label>
                <input required value={newName} onChange={e=>setNewName(e.target.value)} type="text" className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[var(--text-main)]">Course</label>
                <input required value={newCourse} onChange={e=>setNewCourse(e.target.value)} type="text" className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" placeholder="BSc Computer Science" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  {editingId ? 'Update Password (leave blank to keep)' : 'Initial Password'}
                </label>
                <input required={!editingId} value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="text" className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" placeholder={editingId ? "Type new password to update..." : "Type initial password..."} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)] mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {creating ? 'Saving...' : (editingId ? 'Update Student' : 'Create Student')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Student Management</h1>
          <p className="mt-2 text-muted font-medium">Manage student accounts, registration, and access limits.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={openAddModal} className="flex items-center px-5 py-2.5 border border-transparent rounded-xl shadow-sm shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95">
            <Plus className="w-5 h-5 mr-2" /> Add Student
          </button>
        </div>
      </div>

      <div className="premium-card overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--bg-app)]">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Student Profile</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Reg Number</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden md:table-cell">Course</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted font-medium">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center flex flex-col items-center">
                  <Users className="w-12 h-12 text-muted opacity-50 mb-4" />
                  <p className="text-[var(--text-main)] font-semibold text-lg">No students found</p>
                  <p className="text-sm text-muted mt-1">Get started by adding a new student to the system.</p>
                </td>
              </tr>
            ) : students.map((student) => (
              <tr key={student.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                <td className="px-6 py-5 whitespace-normal break-words sm:whitespace-nowrap text-sm text-[var(--text-main)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                       {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{student.fullName}</div>
                      <div className="text-xs font-medium text-muted mt-0.5">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-[var(--text-main)] hidden sm:table-cell">
                  {student.regNumber}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-muted font-medium hidden md:table-cell">{student.course}</td>
                <td className="px-6 py-5 whitespace-nowrap hidden sm:table-cell">
                  <span className={clsx(
                    "px-2.5 py-1 inline-flex text-xs font-bold rounded-md shadow-sm border",
                    student.status === 'active' 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" 
                      : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                  )}>
                    {student.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => setViewingPerformance(student)} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">Performance</button>
                  <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Edit</button>
                  <button onClick={async () => {
                    if (confirm('Delete this student permanently?')) {
                      try {
                        await deleteDoc(doc(db, 'students', student.id));
                        setStudents(prev => prev.filter(s => s.id !== student.id));
                      } catch (err) {
                        alert('Failed to delete student');
                      }
                    }
                  }} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
