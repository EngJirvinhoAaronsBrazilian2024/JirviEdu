import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, getDocs, doc, getDoc, mutationEmitter } from '../../lib/db';
import { FileDown, BookOpen } from 'lucide-react';
import { Module } from '../../types';

export default function StudentMaterials({ studentId }: { studentId: string }) {
  const [materials, setMaterials] = useState<{mod: Module, mat: any}[]>([]);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let lastHash = '';
    
    const fetchMaterials = async () => {
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

        const allMats: {mod: Module, mat: any}[] = [];
        for (const m of enrolledMods) {
          const matSnap = await getDocs(collection(db, `modules/${m.id}/learningMaterials`));
          matSnap.docs.forEach(d => {
            allMats.push({ mod: m, mat: { id: d.id, ...d.data() } });
          });
        }
        
        if (!isMounted) return;
        const newHash = JSON.stringify(allMats);
        if (newHash !== lastHash) {
          setMaterials(allMats);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
      }
    };
    
    fetchMaterials();
    const interval = setInterval(fetchMaterials, 3000);
    const unsub = mutationEmitter.subscribe(fetchMaterials);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [studentId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Materials</h1>
        <p className="mt-1 text-sm text-neutral-400">Download course materials and notes.</p>
      </div>

      <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden">
        <ul className="divide-y divide-neutral-200">
          {materials.map((item, idx) => (
            <li key={idx} className="p-4 hover:bg-neutral-700 transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.mat.title}</h3>
                  <div className="flex items-center text-xs text-neutral-400 mt-1">
                    <span className="font-medium text-neutral-200 mr-2">{item.mod.code}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="ml-2">{item.mod.name}</span>
                  </div>
                </div>
              </div>
              <div>
                <a href={item.mat.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-neutral-600 shadow-sm text-sm font-medium rounded-md text-neutral-200 bg-neutral-800 hover:bg-neutral-700">
                  <FileDown className="w-4 h-4 mr-2 text-neutral-400" /> Download
                </a>
              </div>
            </li>
          ))}
          {materials.length === 0 && (
            <li className="p-8 text-center text-neutral-400">
              No learning materials have been uploaded yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
