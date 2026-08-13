import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot } from '../../lib/db';
import { Module, Teacher } from '../../types';
import { BookOpen, Video, Users, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function TeacherDashboard({ teacher }: { teacher: Teacher | null }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [upcomingLectures, setUpcomingLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacher || !teacher.assignedModules || teacher.assignedModules.length === 0) {
      setLoading(false);
      return;
    }

    const unsubs: any[] = [];
    
    // Fetch Modules
    const q = query(collection(db, 'modules'));
    const unsubM = onSnapshot(q, (snap: any) => {
      let mods = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Module));
      mods = mods.filter(m => teacher.assignedModules.includes(m.id));
      setModules(mods);
    });
    unsubs.push(unsubM);

    // Fetch Lectures for assigned modules
    const allLectures: any[] = [];
    teacher.assignedModules.forEach(moduleId => {
      const unsubL = onSnapshot(query(collection(db, `modules/${moduleId}/lectures`)), (snap: any) => {
        const lecs = snap.docs.map((d: any) => ({ ...d.data(), id: d.id, moduleId }));
        
        // Remove old ones for this module and add new
        const filtered = allLectures.filter(l => l.moduleId !== moduleId);
        filtered.push(...lecs);
        
        // Update allLectures array in place
        allLectures.length = 0;
        allLectures.push(...filtered);

        // Filter for upcoming (today or future)
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcoming = allLectures.filter(l => {
          if (!l.date) return true;
          return new Date(l.date) >= today;
        }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        
        setUpcomingLectures(upcoming.slice(0, 5)); // Top 5 upcoming
        setLoading(false);
      });
      unsubs.push(unsubL);
    });

    return () => unsubs.forEach(fn => fn && fn());
  }, [teacher]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">
          Welcome back, {teacher?.fullName?.split(' ')[0] || 'Teacher'}!
        </h1>
        <p className="mt-2 text-muted font-medium">Here's what's happening with your modules today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
        >
          <div className="p-3 rounded-xl shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide leading-tight">Assigned Modules</p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mt-0.5">{modules.length}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
        >
          <div className="p-3 rounded-xl shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Video className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide leading-tight">Upcoming Lectures</p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mt-0.5">{upcomingLectures.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Modules List */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
              Your Modules
            </h2>
            <Link to="/teacher/modules" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {modules.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No modules assigned yet.</div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {modules.map(m => (
                  <li key={m.id} className="p-5 hover:bg-[var(--bg-app)] transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-[var(--text-main)]">{m.code} - {m.name}</h3>
                        <p className="text-sm text-muted mt-1 line-clamp-2">{m.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Upcoming Lectures List */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Upcoming Schedule
            </h2>
            <Link to="/teacher/lectures" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center">
              Manage <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {upcomingLectures.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No upcoming lectures scheduled.</div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {upcomingLectures.map(l => {
                  const mod = modules.find(m => m.id === l.moduleId);
                  return (
                    <li key={l.id} className="p-5 hover:bg-[var(--bg-app)] transition-colors flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center mr-4 flex-shrink-0">
                        <span className="text-xs font-bold uppercase">{new Date(l.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{new Date(l.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{l.title}</h3>
                        <p className="text-xs text-muted font-medium mt-0.5">{mod?.code || 'Module'} • {l.time}</p>
                      </div>
                      {l.meetLink && (
                        <a href={l.meetLink} target="_blank" rel="noopener noreferrer" className="ml-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors whitespace-nowrap">
                          Join
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
