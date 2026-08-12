import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, getDocs, doc, getDoc, mutationEmitter } from '../../lib/db';
import { Video, Calendar as CalendarIcon, Clock, ExternalLink, PlayCircle, BookOpen } from 'lucide-react';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function StudentLectures({ studentId }: { studentId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lectures, setLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let lastHash = '';
    
    const fetchLectures = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        if (!isMounted) return;
        
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));
        
        const enrolledMods: Module[] = [];
        for (const m of mods) {
          const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            enrolledMods.push(m);
          }
        }
        
        setModules(enrolledMods);

        const allLecs: {mod: Module, lec: any}[] = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (const m of enrolledMods) {
          const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
          lecsSnap.docs.forEach(d => {
            const data = d.data();
            if (data.date) {
               const parts = data.date.split('-');
               if (parts.length === 3) {
                 const lecDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                 if (lecDay.getTime() < today.getTime()) {
                   return;
                 }
               }
            }
            allLecs.push({ mod: m, lec: { id: d.id, ...data } });
          });
        }
        
        if (!isMounted) return;
        
        allLecs.sort((a, b) => {
           const timeA = new Date(`${a.lec.date}T${a.lec.time}`).getTime();
           const timeB = new Date(`${b.lec.date}T${b.lec.time}`).getTime();
           return timeA - timeB;
        });

        const newHash = JSON.stringify(allLecs);
        if (newHash !== lastHash) {
          setLectures(allLecs);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
        setLoading(false);
      }
    };
    
    fetchLectures();
    const interval = setInterval(fetchLectures, 3000);
    const unsub = mutationEmitter.subscribe(fetchLectures);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [studentId]);

  const todayCount = lectures.filter(l => new Date(l.lec.date).toDateString() === new Date().toDateString()).length;
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
          <PlayCircle className="w-8 h-8 mr-3 text-blue-500" />
          Live Lectures
        </h1>
        <p className="mt-2 text-muted font-medium max-w-2xl">
          Access your scheduled video classes across all enrolled modules.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <BookOpen className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Enrolled Modules</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{modules.length}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Video className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Upcoming Lectures</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{lectures.length}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Clock className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Classes Today</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{todayCount}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[var(--text-main)] font-semibold">Loading your schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {lectures.map((item, idx) => {
              const lecDate = new Date(`${item.lec.date}T${item.lec.time}`).getTime();
              const now = Date.now();
              const isPastTime = lecDate <= now;
              const isToday = new Date(item.lec.date).toDateString() === new Date().toDateString();

              return (
                <motion.div 
                  key={`${item.mod.id}-${item.lec.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={clsx(
                    "premium-card rounded-2xl flex flex-col h-full border-2 transition-all group overflow-hidden",
                    isPastTime 
                      ? "border-blue-500 bg-blue-50/30 dark:bg-blue-500/5 shadow-[0_8px_30px_rgba(59,130,246,0.15)]" 
                      : "border-transparent bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:shadow-md"
                  )}
                >
                  {isToday && !isPastTime && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                  )}
                  {isPastTime && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                        isPastTime
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      )}>
                        <Video className="w-6 h-6" />
                      </div>
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase border",
                        isPastTime 
                          ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                          : "bg-[var(--bg-app)] text-muted border-[var(--border-strong)]"
                      )}>
                        {item.mod.code}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-1 line-clamp-2 leading-tight">
                      {item.lec.title}
                    </h3>
                    <p className="text-sm font-medium text-muted mb-6">
                      {item.mod.name}
                    </p>
                    
                    <div className="mt-auto space-y-3 bg-[var(--bg-app)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <div className="flex items-center text-sm font-bold text-[var(--text-main)]">
                        <CalendarIcon className="w-4 h-4 mr-2 text-muted" />
                        {new Date(item.lec.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        {isToday && <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500">Today</span>}
                      </div>
                      <div className="flex items-center text-sm font-bold text-[var(--text-main)]">
                        <Clock className="w-4 h-4 mr-2 text-muted" />
                        {new Date(`${item.lec.date}T${item.lec.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                    {isPastTime ? (
                      <a 
                        href={item.lec.meetLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full flex justify-center items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-sm font-bold transition-all active:scale-95 group/btn"
                      >
                        Join Class Now
                        <ExternalLink className="w-4 h-4 ml-2 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                      </a>
                    ) : (
                      <button 
                        disabled 
                        className="w-full flex justify-center items-center px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-strong)] text-muted rounded-xl text-sm font-bold cursor-not-allowed opacity-80"
                      >
                        Starts Later
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {lectures.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                <Video className="w-8 h-8 text-muted opacity-50" />
              </div>
              <p className="text-[var(--text-main)] font-semibold text-lg">No upcoming lectures</p>
              <p className="text-sm text-muted mt-1 text-center max-w-md">There are no scheduled lectures across your enrolled modules.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
