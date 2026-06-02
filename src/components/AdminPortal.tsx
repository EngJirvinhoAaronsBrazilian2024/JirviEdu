import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, query, onSnapshot } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, BookOpen, Video, FileText, 
  Settings, LogOut, Menu, X, Calendar, FileDown, Plus
} from 'lucide-react';
import clsx from 'clsx';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Student, Module } from '../types';

import AdminModules from './admin/AdminModules';
import AdminLectures from './admin/AdminLectures';
import AdminAssignments from './admin/AdminAssignments';
import AdminMaterials from './admin/AdminMaterials';

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
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
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-slate-900 overflow-hidden lg:border-r lg:border-slate-800">
        <div className="flex items-center h-16 px-6 bg-slate-900/50">
          <span className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
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
          <div className="flex items-center px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-indigo-400">AD</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-slate-500" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/50 backdrop-blur-md border-b border-slate-200/60 lg:hidden px-4 justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-slate-900 tracking-tight">JIRVI EDU ADMIN</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/modules" element={<AdminModules />} />
            <Route path="/lectures" element={<AdminLectures />} />
            <Route path="/assignments" element={<AdminAssignments />} />
            <Route path="/timetable" element={<div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-neutral-200"><h2 className="text-xl font-bold mb-2">Timetable</h2><p className="text-neutral-500">The timetable is automatically generated from scheduled Lectures. Go to the Lectures tab to schedule new classes.</p></div>} />
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentsSnap = await getDocs(collection(fbDb, 'students'));
        const modulesSnap = await getDocs(collection(fbDb, 'modules'));
        
        let assignmentsCount = 0;
        let lecturesCount = 0;

        for (const modDoc of modulesSnap.docs) {
          const assignmentsSnap = await getDocs(collection(fbDb, `modules/${modDoc.id}/assignments`));
          assignmentsCount += assignmentsSnap.docs.length;

          const lecturesSnap = await getDocs(collection(fbDb, `modules/${modDoc.id}/lectures`));
          lecturesCount += lecturesSnap.docs.length;
        }

        setStats({
          students: studentsSnap.docs.length,
          modules: modulesSnap.docs.length,
          assignments: assignmentsCount,
          lectures: lecturesCount
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5">
        <h2 className="text-lg font-bold text-slate-900 mb-6">System Statistics</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-indigo-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between z-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-indigo-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.students}</span>
            </div>
            <p className="text-sm font-semibold text-indigo-600/80 z-10">Total Students</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-blue-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between z-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-blue-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.modules}</span>
            </div>
            <p className="text-sm font-semibold text-blue-600/80 z-10">Active Modules</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between z-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.assignments}</span>
            </div>
            <p className="text-sm font-semibold text-emerald-600/80 z-10">Total Assignments</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-amber-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between z-10">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-amber-50 flex items-center justify-center">
                <Video className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.lectures}</span>
            </div>
            <p className="text-sm font-semibold text-amber-600/80 z-10">Lectures Scheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { db as fbDb } from '../lib/firebase';

function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const email = `${newReg.toLowerCase().replace(/\s+/g, '')}@student.jirvi.edu`;
      const uid = `stu_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create the Firestore document directly
      await setDoc(doc(fbDb, 'students', uid), {
        regNumber: newReg,
        fullName: newName,
        email: email,
        course: newCourse,
        status: 'active',
        createdAt: Date.now()
      });

      setModalOpen(false);
      setNewReg('');
      setNewName('');
      setNewCourse('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      alert("Error creating student. See console.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h3 className="text-lg font-medium text-neutral-900">Add New Student</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Registration Number</label>
                <input required value={newReg} onChange={e=>setNewReg(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. REG12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                <input required value={newName} onChange={e=>setNewName(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Course</label>
                <input required value={newCourse} onChange={e=>setNewCourse(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="BSc Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Default Password</label>
                <input required value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="Auto or Type..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Student Management</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage student accounts, registration, and access limits.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-neutral-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reg Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">No students found.</td></tr>
            ) : students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{student.regNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  <div>{student.fullName}</div>
                  <div className="text-xs text-neutral-400">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{student.course}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", student.status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
