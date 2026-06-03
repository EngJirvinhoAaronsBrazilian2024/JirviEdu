import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { Video, Calendar as CalendarIcon } from 'lucide-react';
import { Module } from '../../types';

export default function StudentLectures({ studentId }: { studentId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lectures, setLectures] = useState<{mod: Module, lec: any}[]>([]);

  useEffect(() => {
    const fetchLectures = async () => {
      const q = query(collection(db, 'modules'));
      const snap = await getDocs(q);
      const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));
      setModules(mods);

      const allLecs: {mod: Module, lec: any}[] = [];
      for (const m of mods) {
        const lecsSnap = await getDocs(collection(db, `modules/${m.id}/lectures`));
        lecsSnap.docs.forEach(d => {
          allLecs.push({ mod: m, lec: { id: d.id, ...d.data() } });
        });
      }
      // Sort by date/time ideally, simplified here
      setLectures(allLecs);
    };
    fetchLectures();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Upcoming Lectures</h1>
        <p className="mt-1 text-sm text-neutral-400">Access your scheduled video classes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lectures.map((item, idx) => (
          <div key={idx} className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-800">
                {item.mod.code}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{item.lec.title}</h3>
            <div className="mt-auto space-y-3">
              <div className="flex items-center text-sm text-neutral-400">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {item.lec.date} at {item.lec.time}
              </div>
              <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors">
                Join Class
              </a>
            </div>
          </div>
        ))}
        {lectures.length === 0 && (
          <div className="col-span-full bg-neutral-800 p-8 rounded-xl border border-neutral-700 text-center text-neutral-400">
            No lectures scheduled across your modules.
          </div>
        )}
      </div>
    </div>
  );
}
