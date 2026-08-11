import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/db';
import { doc, getDoc, collection, query, getDocs } from '../lib/db';
import { 
  LayoutDashboard, BookOpen, Video, FileText, 
  Calendar, FileDown, LogOut, Menu, X, Bell, Settings, PieChart, ChevronLeft, ChevronRight, TrendingUp, Search
} from 'lucide-react';
import clsx from 'clsx';
import { Student, Module } from '../types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'motion/react';

import StudentModules from './student/StudentModules';
import StudentLectures from './student/StudentLectures';
import StudentAssignments from './student/StudentAssignments';
import StudentMaterials from './student/StudentMaterials';
import StudentResults from './student/StudentResults';
import StudentSettings from './student/StudentSettings';
import Timetable from './Timetable';
import { Award, GraduationCap } from 'lucide-react';
import appIcon from '../../public/icon.png';

export default function StudentPortal({ setRole }: { setRole: (role: string | null) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchStudent = async () => {
      const studentId = sessionStorage.getItem('jirvi_student_id') || localStorage.getItem('jirvi_student_id');
      
      if (studentId) {
        try {
          const docRef = doc(db, 'students', studentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setStudent({ id: docSnap.id, ...(docSnap.data() as any) } as Student);
          } else {
            handleLogout();
            return;
          }
        } catch (e) {
          console.error(e);
          handleLogout();
          return;
        }
      } else {
        handleLogout();
        return;
      }
      setLoading(false);
    };
    
    fetchStudent();
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('jirvi_role');
    localStorage.removeItem('jirvi_student_reg');
    localStorage.removeItem('jirvi_student_id');
    setRole(null);
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
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-main)]">Loading...</div>;
  }

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
                  <img src={appIcon} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
                  JIRVI EDU
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
            <img src={appIcon} alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
            JIRVI EDU
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
                {current && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full" />}
                <item.icon className={clsx('mr-4 flex-shrink-0 h-5 w-5 z-10 relative', current ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                <span className="z-10 relative">{item.name}</span>
              </Link>
            );
          })}
        </nav>
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
                placeholder="Search courses, assignments..."
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <ThemeToggle />
              
              {student?.id && <NotificationBell userId={student.id} />}

              <div className="h-8 w-px bg-[var(--border-subtle)] hidden sm:block"></div>

              {/* User Dropdown trigger mockup */}
              <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-app)] transition-all">
                {student?.photoUrl ? (
                  <img src={student.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-[var(--border-subtle)] shadow-sm" />
                ) : (
                  <div className="w-9 h-9 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-[var(--border-subtle)] shadow-sm">
                    {student?.fullName?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[var(--text-main)] leading-none mb-1">{student?.fullName || 'Student'}</p>
                  <p className="text-xs text-muted leading-none font-medium">{student?.regNumber || 'Not Registered'}</p>
                </div>
              </div>
              
              <button onClick={handleLogout} className="lg:hidden p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 hover:bg-red-100 transition-colors shadow-sm">
                <LogOut className="h-5 w-5" />
              </button>
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
                <Route path="/" element={<StudentDashboard student={student} />} />
                <Route path="/modules" element={<StudentModules studentId={student?.id || ''} />} />
                <Route path="/lectures" element={<StudentLectures studentId={student?.id || ''} />} />
                <Route path="/assignments" element={<StudentAssignments studentId={student?.id || ''} />} />
                <Route path="/results" element={<StudentResults student={student} />} />
                <Route path="/timetable" element={<Timetable studentId={student?.id || ''} />} />
                <Route path="/materials" element={<StudentMaterials studentId={student?.id || ''} />} />
                <Route path="/settings" element={<StudentSettings student={student} studentId={student?.id || ''} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StudentDashboard({ student }: { student: Student | null }) {
  const [upcomingLectures, setUpcomingLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [allLectures, setAllLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [stats, setStats] = useState({ modules: 0, assignments: 0, upcomingLectures: 0, results: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }

    const fetchLectures = async () => {
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

        const enrolledMods: Module[] = [];
        for (const m of mods) {
          const docRef = doc(db, `modules/${m.id}/enrollments`, student.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            enrolledMods.push(m);
          }
        }

        const allLecs: {mod: Module, lec: any}[] = [];
        let assignmentsCount = 0;
        let resultsCount = 0;

        for (const m of enrolledMods) {
          const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
          lecsSnap.docs.forEach(d => {
            allLecs.push({ mod: m, lec: { id: d.id, ...d.data() } });
          });

          const assignmentsSnap = await getDocs(collection(db, `modules/${m.id}/assignments`));
          assignmentsCount += assignmentsSnap.docs.length;

          // For results we can just mock or fetch
          const resultsSnap = await getDocs(collection(db, `students/${student.id}/results`)).catch(() => ({ docs: [] }));
          resultsCount = resultsSnap.docs.length || 0;
        }

        allLecs.sort((a,b) => {
          const dateA = new Date(`${a.lec.date}T${a.lec.time}`).getTime();
          const dateB = new Date(`${b.lec.date}T${b.lec.time}`).getTime();
          return dateA - dateB;
        });
        
        setAllLectures(allLecs);

        const now = new Date();
        now.setHours(0,0,0,0);
        
        const upcoming = allLecs.filter(l => {
          const lDate = new Date(`${l.lec.date}T${l.lec.time}`);
          return lDate.getTime() >= now.getTime();
        });

        setUpcomingLectures(upcoming.slice(0, 3)); 
        setStats({
          modules: enrolledMods.length,
          assignments: assignmentsCount,
          upcomingLectures: upcoming.length,
          results: resultsCount
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [student]);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, "d");
      const cloneDay = day;
      const isLectureDay = allLectures.some(item => isSameDay(new Date(`${item.lec.date}T${item.lec.time}`), cloneDay));
      const today = isToday(day);
      const isCurrentMonth = isSameMonth(day, monthStart);
      
      days.push(
        <div 
          key={day.toString()} 
          className={clsx(
            "h-10 w-10 flex flex-col items-center justify-center rounded-full text-sm mx-auto transition-all",
            !isCurrentMonth ? "text-muted opacity-40" : today ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30" : "text-[var(--text-main)] hover:bg-[var(--bg-app)] font-medium",
            isLectureDay && !today && isCurrentMonth && "ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold"
          )}
        >
          <span>{formattedDate}</span>
          {isLectureDay && isCurrentMonth && !today && (
            <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5 absolute bottom-1.5"></div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1 py-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const attendanceData = [
    { name: 'Attended', value: 85, color: '#3b82f6' },
    { name: 'Missed', value: 15, color: '#e2e8f0' } 
  ];

  const performanceData = [
    { name: 'Week 1', score: 75 },
    { name: 'Week 2', score: 82 },
    { name: 'Week 3', score: 78 },
    { name: 'Week 4', score: 88 },
    { name: 'Week 5', score: 92 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Welcome back, {student?.fullName?.split(' ')[0] || 'Student'}! 👋</h1>
          <p className="mt-2 text-muted font-medium">Continue your learning journey and stay on top of your schedule.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-95">
          <BookOpen className="w-5 h-5" />
          Continue Learning
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-orange-400 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <BookOpen className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.modules}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Enrolled<br/>Modules</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <FileText className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.assignments}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Total<br/>Assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-pink-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <Video className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.upcomingLectures}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Upcoming<br/>Lectures</p>
            </div>
          </div>
        </div>

        <div className="bg-teal-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <PieChart className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.results || 'N/A'}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Published<br/>Results</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 md:p-8 col-span-1 lg:col-span-2 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mr-4 border border-blue-200 dark:border-blue-800/50 shadow-inner">
                <Video className="w-5 h-5"/>
              </div>
              Upcoming Live Classes
            </h2>
            <Link to="/student/lectures" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</Link>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : upcomingLectures.length > 0 ? (
            <div className="space-y-4 flex-1 relative z-10">
              {upcomingLectures.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-subtle)] hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors shadow-sm group/item">
                  <div className="flex items-start sm:items-center mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center mr-4 shadow-sm border border-[var(--border-subtle)] shrink-0">
                      <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-main)] text-base group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{item.lec.title}</h3>
                      <p className="text-sm font-medium text-muted mt-1">{item.mod.code} • <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.lec.date} at {item.lec.time}</span></p>
                    </div>
                  </div>
                  <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-strong)] rounded-xl hover:bg-blue-600 hover:text-white hover:border-transparent text-sm font-semibold transition-all shadow-sm text-center">Join Class</a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-app)] rounded-2xl border border-[var(--border-subtle)] border-dashed p-8 text-center text-muted flex-1 flex items-center justify-center flex-col min-h-[200px]">
              <div className="w-12 h-12 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-4 shadow-sm border border-[var(--border-subtle)]">
                <BookOpen className="w-6 h-6 text-muted" />
              </div>
              <p className="font-medium">No upcoming lectures scheduled.</p>
              <p className="text-sm mt-1">Enjoy your free time!</p>
            </div>
          )}
        </div>

        <div className="premium-card p-6 md:p-8 flex flex-col relative overflow-hidden">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4 border border-emerald-200 dark:border-emerald-800/50 shadow-inner">
              <PieChart className="w-5 h-5"/>
            </div>
            Attendance
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center relative">
             <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={8}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? 'var(--border-strong)' : entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                      itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-2">
                 <span className="text-4xl font-bold text-[var(--text-main)] tracking-tight">85%</span>
                 <span className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Overall</span>
              </div>
              <div className="mt-8 w-full flex justify-center gap-6">
                 {attendanceData.map((entry, index) => (
                    <div key={index} className="flex items-center text-sm font-medium">
                       <span className="w-3 h-3 rounded-full mr-2.5 shadow-sm" style={{ backgroundColor: index === 1 ? 'var(--border-strong)' : entry.color }}></span>
                       <span className="text-[var(--text-main)]">{entry.name} <span className="text-muted ml-1">{entry.value}%</span></span>
                    </div>
                 ))}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 md:p-8 flex flex-col lg:col-span-1">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mr-4 border border-amber-200 dark:border-amber-800/50 shadow-inner">
              <Bell className="w-5 h-5"/>
            </div>
            Announcements
          </h2>
          <div className="bg-[var(--bg-app)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm flex-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[var(--text-main)]">Welcome to JIRVI EDU</p>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">Please make sure to check your enrolled modules for required materials.</p>
              </div>
              
              <div className="h-px bg-[var(--border-subtle)] w-full my-4"></div>
              
              <div>
                <p className="text-sm font-bold text-[var(--text-main)] mb-2">Upcoming Exam Schedule</p>
                <p className="text-sm text-muted leading-relaxed">The final schedule will be posted next week on the dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 md:p-8 lg:col-span-2 flex flex-col">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mr-4 border border-indigo-200 dark:border-indigo-800/50 shadow-inner">
                  <Calendar className="w-5 h-5"/>
                </div>
                Academic Calendar
              </h2>
              <div className="flex items-center justify-between bg-[var(--bg-app)] px-2 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                 <button onClick={handlePrevMonth} className="text-muted hover:text-[var(--text-main)] p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <span className="text-sm font-bold text-[var(--text-main)] min-w-[120px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                 </span>
                 <button onClick={handleNextMonth} className="text-muted hover:text-[var(--text-main)] p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
           
           <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 gap-1 mb-3">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-muted py-2 uppercase tracking-wider">{day}</div>
                 ))}
              </div>
              <div className="flex-1 flex flex-col relative z-10">
                 {rows}
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-6 text-xs font-semibold text-muted">
                <div className="flex items-center gap-2.5"><span className="w-3 h-3 bg-blue-600 rounded-md shadow-sm"></span> Today</div>
                <div className="flex items-center gap-2.5"><span className="w-3 h-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-md"></span> Scheduled Lecture</div>
              </div>
           </div>
        </div>
      </div>

      <div className="premium-card p-6 md:p-8">
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-8 flex items-center">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mr-4 border border-purple-200 dark:border-purple-800/50 shadow-inner">
            <TrendingUp className="w-5 h-5" />
          </div>
          Performance Trend
        </h2>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} dx={-10} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8b5cf6" 
                strokeWidth={4} 
                dot={{ fill: 'var(--bg-card)', stroke: '#8b5cf6', strokeWidth: 3, r: 6 }} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#8b5cf6' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
