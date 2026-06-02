import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { BookOpen, CheckCircle } from 'lucide-react';
import { Module } from '../../types';

export default function StudentModules({ studentId }: { studentId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [enrolledModuleIds, setEnrolledModuleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    // We would ideally query all enrollments for this student, but with our current flat schema 
    // it's easier to just fetch all modules and check their enrollments subcollections,
    // OR simply store a flat list of enrollments. For simplicity, we assume they are enrolled in everything in this dummy/demo mode,
    // BUT we will implement a mock enrollment state. Let's fetch all enrollments.
    const fetchEnrollments = async () => {
      const enrolled = new Set<string>();
      for (const m of modules) {
        const snap = await getDocs(collection(db, `modules/${m.id}/enrollments`));
        if (snap.docs.some(d => d.id === studentId)) {
          enrolled.add(m.id);
        }
      }
      setEnrolledModuleIds(enrolled);
    };
    if (modules.length > 0) fetchEnrollments();
  }, [modules, studentId]);

  const handleEnroll = async (moduleId: string) => {
    if (!studentId) return;
    await setDoc(doc(db, `modules/${moduleId}/enrollments`, studentId), {
      studentId: studentId,
      enrolledAt: Date.now()
    });
    setEnrolledModuleIds(prev => new Set(prev).add(moduleId));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Modules</h1>
        <p className="mt-1 text-sm text-neutral-500">View and enroll in courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => {
          const isEnrolled = enrolledModuleIds.has(mod.id);
          return (
            <div key={mod.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col">
              <div className="flex-1">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">{mod.name}</h3>
                <p className="text-sm font-medium text-neutral-500 mb-2">{mod.code}</p>
                <p className="text-sm text-neutral-600 line-clamp-3">{mod.description}</p>
              </div>
              <div className="mt-6">
                {isEnrolled ? (
                  <button disabled className="w-full flex justify-center items-center px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-2" /> Enrolled
                  </button>
                ) : (
                  <button onClick={() => handleEnroll(mod.id)} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {modules.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-neutral-200 text-center text-neutral-500">
            No modules available.
          </div>
        )}
      </div>
    </div>
  );
}
