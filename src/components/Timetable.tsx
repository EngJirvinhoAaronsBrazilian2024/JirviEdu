import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, doc, getDoc, mutationEmitter } from '../lib/db';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Video, Calendar, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Module } from '../types';

export default function Timetable({ studentId }: { studentId?: string }) {
  const [lectures, setLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        if (studentId) {
          for (const m of mods) {
            const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              enrolledMods.push(m);
            }
          }
        }

        const allLecs: {mod: Module, lec: any}[] = [];
        for (const m of enrolledMods) {
          const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
          lecsSnap.docs.forEach(d => {
            allLecs.push({ mod: m, lec: { id: d.id, ...d.data() } });
          });
        }
        
        if (!isMounted) return;

        const newHash = JSON.stringify(allLecs);
        if (newHash !== lastHash) {
          setLectures(allLecs);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
        if (isMounted) setLoading(false);
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

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="max-w-7xl mx-auto space-y-6 flex flex-col h-full print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-800 p-4 md:p-6 rounded-2xl border border-neutral-700/60 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Class Timetable
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">Easily view and join your scheduled classes for the week.</p>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between md:justify-center gap-2 md:gap-4 bg-neutral-900/50 p-1.5 rounded-xl border border-neutral-700/50">
          <button onClick={handlePrevWeek} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-medium flex-1 md:flex-none text-white text-center text-sm md:text-base">
            {format(weekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </div>
          <button onClick={handleNextWeek} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex bg-neutral-800 rounded-2xl border border-neutral-700/60 min-h-[400px] justify-center items-center">
           <p className="text-neutral-400">Loading timetable...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 snap-x snap-mandatory scroll-smooth">
          <div className="flex lg:grid lg:grid-cols-7 gap-4 lg:gap-4 lg:min-w-0">
            {weekDays.map((day, idx) => {
              const dayLectures = lectures.filter(l => isSameDay(new Date(l.lec.date), day))
                .sort((a,b) => a.lec.time.localeCompare(b.lec.time));

              const isToday = isSameDay(new Date(), day);

              return (
                <div key={idx} className={`w-[85vw] sm:w-[280px] lg:w-auto flex-shrink-0 snap-center bg-neutral-800 rounded-2xl border ${isToday ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20' : 'border-neutral-700/60'} shadow-sm flex flex-col overflow-hidden`}>
                  <div className={`p-4 text-center border-b ${isToday ? 'bg-blue-600/10 border-blue-500/30' : 'bg-neutral-900/50 border-neutral-700/60'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-neutral-500'}`}>{format(day, 'EEEE')}</p>
                  <p className={`text-2xl font-bold ${isToday ? 'text-blue-500' : 'text-white'}`}>{format(day, 'd')}</p>
                </div>
                
                <div className="flex-1 p-3 space-y-3 min-h-[150px] overflow-y-auto">
                  {dayLectures.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-500 py-8">
                       No classes
                    </div>
                  ) : (
                    dayLectures.map((item, i) => {
                      const lecDateTime = new Date(`${item.lec.date}T${item.lec.time}`);
                      const isPast = lecDateTime.getTime() < Date.now();

                      return (
                        <div key={i} className={`p-3 rounded-xl border ${isPast ? 'bg-neutral-900/50 border-neutral-800 opacity-60' : 'bg-neutral-900 border-neutral-700'} flex flex-col gap-2 hover:border-blue-500/30 transition-colors`}>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-center">{item.lec.time}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-2 leading-tight" title={item.lec.title}>{item.lec.title}</p>
                            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3"/>{item.mod.code}</p>
                          </div>
                          {studentId && !isPast && (
                            <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="mt-1 w-full flex items-center justify-center py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                              <Video className="w-3 h-3 mr-1" /> Join Focus
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
