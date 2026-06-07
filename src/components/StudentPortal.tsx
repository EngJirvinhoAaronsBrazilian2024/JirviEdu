import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/db';
import { doc, getDoc, collection, query, getDocs } from '../lib/db';
import { 
  LayoutDashboard, BookOpen, Video, FileText, 
  Calendar, FileDown, LogOut, Menu, X, Bell, Settings, PieChart, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';
import clsx from 'clsx';
import { Student, Module } from '../types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import ThemeToggle from './ThemeToggle';

import StudentModules from './student/StudentModules';
import StudentLectures from './student/StudentLectures';
import StudentAssignments from './student/StudentAssignments';
import StudentMaterials from './student/StudentMaterials';
import StudentResults from './student/StudentResults';
import StudentSettings from './student/StudentSettings';
import Timetable from './Timetable';
import { Award } from 'lucide-react';

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
            setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
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
    setRole(null);
    localStorage.removeItem('jirvi_student_reg');
    localStorage.removeItem('jirvi_student_id');
    sessionStorage.removeItem('jirvi_student_reg');
    sessionStorage.removeItem('jirvi_student_id');
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
    return <div className="min-h-screen bg-neutral-900 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex print:block print:bg-neutral-800">
      {/* Mobile sidebar */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden print:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-neutral-900 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <span className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              JIRVI EDU
            </span>
            <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
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
                    current ? 'bg-blue-600/10 text-blue-400' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-blue-400' : 'text-neutral-400 group-hover:text-neutral-300')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-neutral-300 rounded-md hover:bg-neutral-800 hover:text-white transition-colors">
              <LogOut className="mr-3 h-5 w-5 text-neutral-400" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-neutral-900 overflow-hidden lg:border-r lg:border-neutral-800 print:hidden">
        <div className="flex items-center h-16 px-6 bg-neutral-900/50">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            JIRVI EDU
          </span>
        </div>
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-4">
          {student?.photoUrl ? (
            <img src={student.photoUrl} alt={student.fullName} className="w-12 h-12 rounded-xl object-cover shadow-inner" />
          ) : (
            <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl font-bold text-blue-400 shadow-inner">
              {student?.fullName?.charAt(0) || 'S'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{student?.fullName || 'Student'}</p>
            <p className="text-xs text-neutral-400 truncate mt-0.5">{student?.regNumber || 'Not Registered'}</p>
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
                  current ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white border border-transparent',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all'
                )}
              >
                <item.icon className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-blue-400' : 'text-neutral-400 group-hover:text-neutral-300')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-400 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-neutral-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-800 to-neutral-900 print:pl-0 print:bg-neutral-800 print:bg-none">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-neutral-800/50 backdrop-blur-md border-b border-neutral-700/60 lg:hidden px-4 justify-between items-center print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-400 hover:text-neutral-200">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-white tracking-tight">JIRVI EDU</span>
          <ThemeToggle />
        </div>

        {/* Desktop Header Theme Toggle */}
        <div className="hidden lg:flex justify-end p-4 absolute top-0 right-0 w-full z-10 pointer-events-none print:hidden">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
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
        </main>
      </div>
    </div>
  );
}

function StudentDashboard({ student }: { student: Student | null }) {
  const [upcomingLectures, setUpcomingLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [allLectures, setAllLectures] = useState<{mod: Module, lec: any}[]>([]);
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
        for (const m of enrolledMods) {
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
        
        setAllLectures(allLecs);

        // Filter only upcoming or today
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const upcoming = allLecs.filter(l => {
          const lDate = new Date(`${l.lec.date}T${l.lec.time}`);
          return lDate.getTime() >= now.getTime();
        });

        setUpcomingLectures(upcoming.slice(0, 3)); // Top 3
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

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const isLectureDay = allLectures.some(item => isSameDay(new Date(`${item.lec.date}T${item.lec.time}`), cloneDay));
      
      days.push(
        <div 
          key={day.toString()} 
          className={clsx(
            "p-2 flex flex-col items-center justify-center rounded-lg text-sm aspect-square transition-colors",
            !isSameMonth(day, monthStart) ? "text-neutral-600 border-none opacity-50" : isToday(day) ? "bg-blue-600 text-white font-bold" : "text-neutral-300 hover:bg-neutral-700",
            isLectureDay && !isToday(day) && isSameMonth(day, monthStart) && "border border-blue-500/50 text-white font-bold bg-blue-500/10"
          )}
        >
          <span>{formattedDate}</span>
          {isLectureDay && isSameMonth(day, monthStart) && !isToday(day) && (
            <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const attendanceData = [
    { name: 'Attended', value: 85, color: '#3b82f6' },
    { name: 'Missed', value: 15, color: '#262626' } 
  ];

  const performanceData = [
    { name: 'Week 1', score: 75 },
    { name: 'Week 2', score: 82 },
    { name: 'Week 3', score: 78 },
    { name: 'Week 4', score: 88 },
    { name: 'Week 5', score: 92 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {student?.fullName?.split(' ')[0] || 'Student'}!</h1>
        <p className="mt-2 text-neutral-400">Here's a summary of your academic activities for today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700/60 shadow-sm ring-1 ring-neutral-900/5 col-span-1 lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center mr-3">
              <Video className="w-5 h-5 text-blue-500"/>
            </div>
            Upcoming Lectures
          </h2>
          
          {loading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-700 p-8 text-center text-neutral-400 flex-1 flex items-center justify-center">
              Loading lectures...
            </div>
          ) : upcomingLectures.length > 0 ? (
            <div className="space-y-4 flex-1">
              {upcomingLectures.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-800 rounded-2xl border border-neutral-700/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mr-4">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{item.lec.title}</h3>
                      <p className="text-sm font-medium text-neutral-400">{item.mod.code} • <span className="text-blue-600">{item.lec.date} at {item.lec.time}</span></p>
                    </div>
                  </div>
                  <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Join Class</a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-700 p-8 text-center text-neutral-400 border-dashed flex-1 flex items-center justify-center flex-col">
              <BookOpen className="w-10 h-10 text-neutral-600 mb-3" />
              <p>No upcoming lectures scheduled.</p>
            </div>
          )}
        </div>

        <div className="bg-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700 shadow-sm ring-1 ring-neutral-900/5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center mr-3">
              <PieChart className="w-5 h-5 text-emerald-500"/>
            </div>
            Attendance
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900/50 rounded-2xl border border-neutral-700/50 p-6 relative">
             <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '0.5rem', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-2">
                 <span className="text-3xl font-bold text-white">85%</span>
                 <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Overall</span>
              </div>
              <div className="mt-4 w-full flex justify-between px-2">
                 {attendanceData.map((entry, index) => (
                    <div key={index} className="flex items-center text-sm">
                       <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                       <span className="text-neutral-300 font-medium">{entry.name} <span className="ml-1 text-neutral-500">({entry.value}%)</span></span>
                    </div>
                 ))}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700 shadow-sm ring-1 ring-neutral-900/5 flex flex-col lg:col-span-1">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-amber-500"/>
            </div>
            Announcements
          </h2>
          <div className="bg-neutral-900/50 rounded-2xl border border-neutral-700/50 p-5 shadow-sm flex-1">
            <p className="text-sm font-bold text-white mb-1">Welcome to JIRVI EDU</p>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">Please make sure to check your enrolled modules for required materials.</p>
            
            <div className="h-px bg-neutral-700 w-full my-4"></div>
            
            <p className="text-sm font-bold text-white mb-1">Upcoming Exam Schedule</p>
            <p className="text-sm text-neutral-400 leading-relaxed">The final schedule will be posted next week on the dashboard.</p>
          </div>
        </div>

        <div className="bg-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700 shadow-sm ring-1 ring-neutral-900/5 lg:col-span-2 flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center">
                <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center mr-3 border border-neutral-700 shadow-sm">
                  <Calendar className="w-5 h-5 text-blue-500"/>
                </div>
                Academic Calendar
              </h2>
              <div className="flex items-center gap-4 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-700/50">
                 <button onClick={handlePrevMonth} className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-700 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <span className="text-sm font-bold text-white min-w-[100px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                 </span>
                 <button onClick={handleNextMonth} className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-700 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
           
           <div className="bg-neutral-900/50 rounded-2xl border border-neutral-700/50 p-6 flex-1 flex flex-col">
              <div className="grid grid-cols-7 gap-1 mb-2">
                 {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-neutral-500 py-2 uppercase tracking-wider">{day}</div>
                 ))}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                 {rows}
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-700/50 flex items-center gap-4 text-xs font-medium text-neutral-400">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-600 rounded-md"></span> Today</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500/10 border border-blue-500/50 rounded-md"></span> Scheduled Lecture</div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700 shadow-sm ring-1 ring-neutral-900/5">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center mr-3 border border-neutral-700 shadow-sm">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          Performance Trend
        </h2>
        <div className="w-full h-64 bg-neutral-900/50 rounded-2xl border border-neutral-700/50 p-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
              <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '0.5rem', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
