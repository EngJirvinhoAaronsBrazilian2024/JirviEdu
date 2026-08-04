import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from '../../lib/db';
import { Plus, Trash2, Video, Calendar as CalendarIcon, Clock, Link as LinkIcon, Users, AlertCircle, BookOpen } from 'lucide-react';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLectures() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [lectures, setLectures] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!selectedModule) {
      setLectures([]);
      return;
    }
    const q = query(collection(db, `modules/${selectedModule}/lectures`));
    return onSnapshot(q, snap => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const validLectures: any[] = [];
      
      snap.docs.forEach(d => {
        const data = d.data();
        let isPast = false;
        if (data.date) {
           const parts = data.date.split('-');
           if (parts.length === 3) {
             const lecDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
             if (lecDay.getTime() < today.getTime()) {
               isPast = true;
             }
           }
        }
        
        if (isPast) {
          // Auto-delete the expired lecture from the app
          deleteDoc(doc(db, `modules/${selectedModule}/lectures`, d.id)).catch(console.error);
        } else {
          validLectures.push({ id: d.id, ...data });
        }
      });
      
      setLectures(validLectures);
    });
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    const id = crypto.randomUUID();
    const newLec = { title, meetLink, date, time, createdAt: Date.now() };
    await setDoc(doc(db, `modules/${selectedModule}/lectures`, id), newLec);
    setLectures(prev => [...prev, { id, ...newLec }]);
    setTitle(''); setMeetLink(''); setDate(''); setTime('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel and delete this lecture?')) {
      await deleteDoc(doc(db, `modules/${selectedModule}/lectures`, id));
      setLectures(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Lectures Management</h1>
          <p className="mt-2 text-muted font-medium">Schedule and manage live video sessions.</p>
        </div>
      </div>

      <div className="premium-card p-6 md:p-8">
        <label className="block text-sm font-bold text-[var(--text-main)] mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
          Select Module Context
        </label>
        <div className="relative max-w-xl">
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)} 
            className="block w-full appearance-none rounded-xl border border-[var(--border-strong)] px-4 py-3 bg-[var(--bg-app)] text-[var(--text-main)] font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="">-- Choose a module to view or schedule lectures --</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedModule && (
          <motion.div
            key="module-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center">
                <Video className="w-5 h-5 mr-3 text-blue-500" />
                Scheduled Lectures
                <span className="ml-3 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-bold border border-blue-200 dark:border-blue-500/20 shadow-sm">{lectures.length}</span>
              </h2>
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                className="flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> 
                {isAdding ? 'Cancel' : 'Schedule Lecture'}
              </button>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="overflow-hidden"
                >
                  <div className="premium-card p-6 md:p-8 border border-blue-500/20 shadow-blue-500/5">
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">New Lecture Details</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Lecture Topic / Title</label>
                        <input required placeholder="e.g. Introduction to React Hooks" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Meeting Link (Google Meet / Zoom)</label>
                        <div className="relative">
                          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                          <input required placeholder="https://meet.google.com/..." value={meetLink} onChange={e=>setMeetLink(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] pl-9 pr-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Date</label>
                        <div className="relative">
                          <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                          <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] pl-9 pr-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Time</label>
                        <div className="relative">
                          <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                          <input required type="time" value={time} onChange={e=>setTime(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] pl-9 pr-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                        </div>
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-[var(--border-subtle)] pt-6">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex justify-center items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 text-sm font-semibold transition-all">
                          Save Schedule
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="premium-card overflow-hidden">
              {lectures.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                    <Video className="w-8 h-8 text-muted opacity-50" />
                  </div>
                  <p className="text-[var(--text-main)] font-semibold text-lg">No lectures scheduled</p>
                  <p className="text-sm text-muted mt-1 max-w-md">There are no upcoming lectures for this module. Past lectures are automatically archived.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                    <thead className="bg-[var(--bg-app)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Session Details</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Schedule</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Meeting Link</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                      {lectures.map(lec => (
                        <tr key={lec.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-[var(--text-main)]">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 shadow-sm border border-blue-200 dark:border-blue-500/20 shrink-0">
                                <Video className="w-5 h-5"/>
                              </div>
                              <span className="font-bold">{lec.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-[var(--text-main)] flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-muted"/> {lec.date}</span>
                              <span className="text-xs text-muted font-medium mt-1 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-muted"/> {lec.time}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm">
                            <a href={lec.meetLink} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-bold text-xs transition-colors border border-blue-200 dark:border-blue-500/20">
                              <LinkIcon className="w-3.5 h-3.5 mr-1.5"/>
                              Join Session
                            </a>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete(lec.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
