import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { FileDown, BookOpen } from 'lucide-react';
import { Module } from '../../types';

export default function StudentMaterials({ studentId }: { studentId: string }) {
  const [materials, setMaterials] = useState<{mod: Module, mat: any}[]>([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      const q = query(collection(db, 'modules'));
      const snap = await getDocs(q);
      const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

      const allMats: {mod: Module, mat: any}[] = [];
      for (const m of mods) {
        const matSnap = await getDocs(collection(db, `modules/${m.id}/learningMaterials`));
        matSnap.docs.forEach(d => {
          allMats.push({ mod: m, mat: { id: d.id, ...d.data() } });
        });
      }
      setMaterials(allMats);
    };
    fetchMaterials();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Learning Materials</h1>
        <p className="mt-1 text-sm text-neutral-500">Download course materials and notes.</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-neutral-200">
          {materials.map((item, idx) => (
            <li key={idx} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{item.mat.title}</h3>
                  <div className="flex items-center text-xs text-neutral-500 mt-1">
                    <span className="font-medium text-neutral-700 mr-2">{item.mod.code}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="ml-2">{item.mod.name}</span>
                  </div>
                </div>
              </div>
              <div>
                <a href={item.mat.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
                  <FileDown className="w-4 h-4 mr-2 text-neutral-500" /> Download
                </a>
              </div>
            </li>
          ))}
          {materials.length === 0 && (
            <li className="p-8 text-center text-neutral-500">
              No learning materials have been uploaded yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
