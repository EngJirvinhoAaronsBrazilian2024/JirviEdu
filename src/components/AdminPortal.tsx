import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/db';
import { collection, getDocs, doc, setDoc, deleteDoc, query, onSnapshot } from '../lib/db';
import { 
  LayoutDashboard, Users, BookOpen, Video, FileText, 
  Settings, LogOut, Menu, X, Calendar, FileDown, Plus
} from 'lucide-react';
import clsx from 'clsx';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Student, Module } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import ThemeToggle from './ThemeToggle';

import AdminModules from './admin/AdminModules';
import AdminLectures from './admin/AdminLectures';
import AdminAssignments from './admin/AdminAssignments';
import AdminMaterials from './admin/AdminMaterials';
import Timetable from './Timetable';

export default function AdminPortal({ setRole }: { setRole: (role: string | null) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setRole(null);
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Modules', href: '/admin/modules', icon: BookOpen },
    { name: 'Lectures', href: '/admin/lectures', icon: Video },
    { name: 'Assignments', href: '/admin/assignments', icon: FileText },
    { name: 'Timetable', href: '/admin/timetable', icon: Calendar },
    { name: 'Materials', href: '/admin/materials', icon: FileDown },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 flex">
      {/* Mobile sidebar */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
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
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-neutral-900 overflow-hidden lg:border-r lg:border-neutral-800">
        <div className="flex items-center h-16 px-6 bg-neutral-900/50">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            JIRVI EDU
          </span>
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
          <div className="flex items-center px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-blue-400">AD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-400 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-neutral-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-neutral-800/50 backdrop-blur-md border-b border-neutral-700/60 lg:hidden px-4 justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-400 hover:text-neutral-200">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-white tracking-tight">JIRVI EDU ADMIN</span>
          <ThemeToggle />
        </div>

        {/* Desktop Header Theme Toggle */}
        <div className="hidden lg:flex justify-end p-4 absolute top-0 right-0 w-full z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/modules" element={<AdminModules />} />
            <Route path="/lectures" element={<AdminLectures />} />
            <Route path="/assignments" element={<AdminAssignments />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/materials" element={<AdminMaterials />} />
          </Routes>
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
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStats = async () => {
      let stCount = 0;
      let mCount = 0;
      let assignmentsCount = 0;
      let lecturesCount = 0;
      const allSubs: any[] = [];

      try {
        const studentsSnap = await getDocs(collection(fbDb, 'students'));
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
        const modulesSnap = await getDocs(collection(fbDb, 'modules'));
        mCount = modulesSnap.docs.length;
        
        for (const modDoc of modulesSnap.docs) {
          const modData = modDoc.data() as any;
          try {
            const assignmentsSnap = await getDocs(collection(fbDb, `modules/${modDoc.id}/assignments`));
            assignmentsCount += assignmentsSnap.docs.length;

            for (const aDoc of assignmentsSnap.docs) {
              const aData = aDoc.data() as any;
              try {
                const subsSnap = await getDocs(collection(fbDb, `modules/${modDoc.id}/assignments/${aDoc.id}/submissions`));
                subsSnap.docs.forEach(subDoc => {
                   allSubs.push({
                     id: subDoc.id,
                     assignmentTitle: aData.title,
                     moduleCode: modData.code,
                     ...subDoc.data()
                   });
                });
              } catch (subErr) {
                console.error("Failed fetching submissions", subErr);
              }
            }
          } catch (aErr) {
            console.error("Failed fetching assignments", aErr);
          }

          try {
            const lecturesSnap = await getDocs(collection(fbDb, `modules/${modDoc.id}/lectures`));
            lecturesCount += lecturesSnap.docs.length;
          } catch (lErr) {
            console.error("Failed fetching lectures", lErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch modules in dashboard", err);
      }

      try {
        allSubs.sort((a,b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        setRecentSubmissions(allSubs.slice(0, 10)); // Top 10 most recent

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
    
    // Subscribe to DB mutations to keep dashboard live
    import('../lib/db').then((dbModule) => {
       if (dbModule.mutationEmitter) {
          const unsub = dbModule.mutationEmitter.subscribe(() => {
             fetchStats();
          });
          return unsub;
       }
    });
  }, []);

  const attendanceData = [
    { name: 'Mon', attendance: 95 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 92 },
    { name: 'Thu', attendance: 85 },
    { name: 'Fri', attendance: 90 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-700/60 ring-1 ring-neutral-900/5 lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-6">System Statistics</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-700/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between z-10">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">{stats.students}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-400 z-10">Total Students</p>
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-700/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between z-10">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">{stats.modules}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-400 z-10">Active Modules</p>
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-700/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between z-10">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">{stats.assignments}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-400 z-10">Total Assignments</p>
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-700/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-amber-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between z-10">
                <div className="w-12 h-12 bg-neutral-800 rounded-xl shadow-sm border border-neutral-700 flex items-center justify-center">
                  <Video className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">{stats.lectures}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-400 z-10">Lectures Scheduled</p>
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-700/60 ring-1 ring-neutral-900/5 lg:col-span-1 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Weekly Attendance</h2>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <RechartsTooltip 
                  cursor={{ fill: '#262626' }}
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '0.5rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Attendance']}
                />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-700/60 ring-1 ring-neutral-900/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Assignment Submissions</h2>
          <span className="text-sm font-medium text-neutral-400">{recentSubmissions.length} submissions</span>
        </div>
        
        {recentSubmissions.length === 0 ? (
           <div className="py-8 text-center text-neutral-500 text-sm">No recent submissions found.</div>
        ) : (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="inline-block min-w-full align-middle md:px-0 px-6">
              <table className="min-w-full divide-y divide-neutral-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Student</th>
                    <th scope="col" className="py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Assignment</th>
                    <th scope="col" className="py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/50">
                  {recentSubmissions.map((sub, i) => (
                    <tr key={i} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-white">{studentsMap[sub.id] || sub.id}</div>
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm text-neutral-300">
                        <span className="font-medium">{sub.assignmentTitle}</span>
                        <span className="text-xs text-neutral-500 ml-2">({sub.moduleCode})</span>
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                         {sub.grade !== undefined ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Graded</span>
                         ) : (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Needs Grading</span>
                         )}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm text-right text-neutral-400">
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

import { db as fbDb } from '../lib/db';

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

  useEffect(() => {
    const q = query(collection(fbDb, 'students'));
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
        studentData.password = newPassword;
      } else {
        const existing = students.find(s => s.id === editingId);
        studentData.createdAt = existing?.createdAt || Date.now();
        if (newPassword) {
          studentData.password = newPassword;
        } else {
          studentData.password = (existing as any)?.password || '';
        }
      }

      await setDoc(doc(fbDb, 'students', uid), studentData, { merge: true });

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
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="bg-neutral-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="text-lg font-medium text-white">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-200">Registration Number</label>
                <input required value={newReg} onChange={e=>setNewReg(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="e.g. REG12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-200">Full Name</label>
                <input required value={newName} onChange={e=>setNewName(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-200">Course</label>
                <input required value={newCourse} onChange={e=>setNewCourse(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="BSc Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-200">
                  {editingId ? 'New Password (leave blank to keep current)' : 'Default Password'}
                </label>
                <input required={!editingId} value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder={editingId ? "Leave blank to keep unchanged" : "Type initial password..."} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-neutral-600 rounded-md shadow-sm text-sm font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Management</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage student accounts, registration, and access limits.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={openAddModal} className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-neutral-800 shadow-sm border border-neutral-700 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Reg Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="bg-neutral-800 divide-y divide-neutral-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-400">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-400">No students found.</td></tr>
            ) : students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{student.regNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                  <div>{student.fullName}</div>
                  <div className="text-xs text-neutral-400">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">{student.course}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", student.status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-900">Edit</button>
                  <button onClick={async () => {
                    if (confirm('Delete this student?')) {
                      try {
                        await deleteDoc(doc(fbDb, 'students', student.id));
                        setStudents(prev => prev.filter(s => s.id !== student.id));
                      } catch (err) {
                        alert('Failed to delete student');
                      }
                    }
                  }} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
