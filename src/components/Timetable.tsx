import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, doc, getDoc, mutationEmitter } from '../lib/db';
import { format, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { Video, Calendar, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Module } from '../types';

export default function Timetable({ studentId }: { studentId?: string }) {
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
          for (const m of mods) {
            const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              enrolledMods.push(m);
            }
          }
        }

        const allLecs: {mod: Module, lec: any}[] = [];
        for (const m of studentId ? enrolledMods : mods) {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-800 p-4 md:p-6 rounded-2xl border border-neutral-700/60 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-50 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Class Timetable
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">Calendar view of all scheduled classes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex bg-neutral-800 rounded-2xl border border-neutral-700/60 min-h-[400px] justify-center items-center">
           <p className="text-neutral-400">Loading timetable...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Calendar View */}
          <div className="bg-neutral-800 rounded-2xl border border-neutral-700/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-700/60 bg-neutral-900/50">
              <button onClick={handlePrevMonth} className="p-2 text-neutral-400 hover:text-neutral-50 rounded-lg hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-medium text-neutral-50 text-base">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={handleNextMonth} className="p-2 text-neutral-400 hover:text-neutral-50 rounded-lg hover:bg-neutral-800 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-neutral-500 py-2">
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
                        ${!isCurrentMonth ? 'text-neutral-600 opacity-50' : 'text-neutral-200'}
                        ${isSelected ? 'bg-blue-600 font-bold text-white shadow-md' : 'hover:bg-neutral-700'}
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
          <div className="bg-neutral-800 rounded-2xl border border-neutral-700/60 shadow-sm flex flex-col h-[400px]">
             <div className="p-4 border-b border-neutral-700/60 bg-neutral-900/50 flex justify-between items-center">
                <h3 className="font-bold text-neutral-50">
                  Schedule for {format(selectedDate, 'MMM do')}
                </h3>
                {isSameDay(selectedDate, new Date()) && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">Today</span>
                )}
             </div>
             <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {selectedDayLectures.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-neutral-500">
                     No classes scheduled
                  </div>
                ) : (
                  selectedDayLectures.map((item, i) => {
                    const lecDateTime = new Date(`${item.lec.date}T${item.lec.time}`);
                    const isPast = lecDateTime.getTime() < Date.now();

                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isPast ? 'bg-neutral-900/50 border-neutral-800 opacity-60' : 'bg-neutral-900 border-neutral-700'} flex flex-col gap-2`}>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-center">{item.lec.time}</span>
                          <span className="text-xs font-medium text-neutral-400 flex items-center gap-1"><BookOpen className="w-3 h-3"/>{item.mod.code}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-50 leading-tight">{item.lec.title}</p>
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
