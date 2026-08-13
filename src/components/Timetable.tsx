import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, doc, getDoc, mutationEmitter } from '../lib/db';
import { format, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { Video, Calendar, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Module } from '../types';

export default function Timetable({ studentId, assignedModules }: { studentId?: string, assignedModules?: string[] }) {
  const [lectures, setLectures] = useState<{mod: Module, lec: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          const validMods = await Promise.all(mods.map(async m => {
            const docSnap = await getDoc(doc(db, `modules/${m.id}/enrollments`, studentId));
            return docSnap.exists() ? m : null;
          }));
          enrolledMods.push(...validMods.filter(Boolean));
        } else if (assignedModules) {
          for (const m of mods) {
            if (assignedModules.includes(m.id)) {
              enrolledMods.push(m);
            }
          }
        }

        const targetMods = (studentId || assignedModules) ? enrolledMods : mods;
        const allLecs = (await Promise.all(targetMods.map(async m => {
          const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
          return lecsSnap.docs.map(d => ({ mod: m, lec: { id: d.id, ...d.data() } }));
        }))).flat();
        
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
    
    const unsub = mutationEmitter.subscribe(fetchLectures);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [studentId]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDayLectures = lectures.filter(l => isSameDay(new Date(l.lec.date), selectedDate))
    .sort((a,b) => a.lec.time.localeCompare(b.lec.time));

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-full print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 premium-card p-4 md:p-6 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Class Timetable
          </h1>
          <p className="text-xs md:text-sm text-muted mt-1">Calendar view of all scheduled classes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex premium-card min-h-[400px] justify-center items-center">
           <p className="text-muted">Loading timetable...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Calendar View */}
          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]">
              <button onClick={handlePrevMonth} className="p-2 text-muted hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-app)] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-medium text-[var(--text-main)] text-base">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={handleNextMonth} className="p-2 text-muted hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-app)] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-muted py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const dayHasClasses = lectures.some(l => isSameDay(new Date(l.lec.date), day));
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square relative
                        ${!isCurrentMonth ? 'text-muted opacity-50' : 'text-[var(--text-main)]'}
                        ${isSelected ? 'bg-blue-600 font-bold text-white shadow-md' : 'hover:bg-[var(--bg-app)]'}
                        ${isToday && !isSelected ? 'border border-blue-500/50 text-blue-400' : ''}
                      `}
                    >
                      <span>{format(day, 'd')}</span>
                      {dayHasClasses && (
                        <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Schedule List */}
          <div className="premium-card flex flex-col h-[400px]">
             <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-main)]">
                  Schedule for {format(selectedDate, 'MMM do')}
                </h3>
                {isSameDay(selectedDate, new Date()) && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">Today</span>
                )}
             </div>
             <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {selectedDayLectures.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted">
                     No classes scheduled
                  </div>
                ) : (
                  selectedDayLectures.map((item, i) => {
                    const lecDateTime = new Date(`${item.lec.date}T${item.lec.time}`);
                    const isPast = lecDateTime.getTime() < Date.now();

                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isPast ? 'bg-[var(--bg-app)] border-[var(--border-subtle)] opacity-60' : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'} flex flex-col gap-2`}>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-center">{item.lec.time}</span>
                          <span className="text-xs font-medium text-muted flex items-center gap-1"><BookOpen className="w-3 h-3"/>{item.mod.code}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)] leading-tight">{item.lec.title}</p>
                        </div>
                        {studentId && !isPast && (
                          <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="mt-2 w-full flex items-center justify-center py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            <Video className="w-3 h-3 mr-1" /> Join Focus
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
