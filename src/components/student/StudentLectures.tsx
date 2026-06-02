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
        <h1 className="text-2xl font-bold text-neutral-900">Upcoming Lectures</h1>
        <p className="mt-1 text-sm text-neutral-500">Access your scheduled video classes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lectures.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                {item.mod.code}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.lec.title}</h3>
            <div className="mt-auto space-y-3">
              <div className="flex items-center text-sm text-neutral-500">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {item.lec.date} at {item.lec.time}
              </div>
              <a href={item.lec.meetLink} target="_blank" rel="noreferrer" className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors">
                Join Class
              </a>
            </div>
          </div>
        ))}
        {lectures.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-neutral-200 text-center text-neutral-500">
            No lectures scheduled across your modules.
          </div>
        )}
      </div>
    </div>
  );
}
