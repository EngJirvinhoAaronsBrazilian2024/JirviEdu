import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from '../../lib/db';
import { BookOpen, Check, Square, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Module } from '../../types';

export default function StudentModules({ studentId }: { studentId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [initialEnrolled, setInitialEnrolled] = useState<Set<string>>(new Set());
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'modules'));
    const unsub = onSnapshot(q, async snap => {
      const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module)).sort((a,b) => a.createdAt - b.createdAt);
      setModules(mods);
      
      if (studentId) {
        const enrolled = new Set<string>();
        for (const m of mods) {
          const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            enrolled.add(m.id);
          }
        }
        setInitialEnrolled(enrolled);
        setSelectedModuleIds(enrolled);
      }
      setLoading(false);
    });
    return unsub;
  }, [studentId]);

  const toggleSelection = (moduleId: string) => {
    setSelectedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const saveChanges = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      for (const m of modules) {
        const wasEnrolled = initialEnrolled.has(m.id);
        const isSelected = selectedModuleIds.has(m.id);
        
        const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
        
        if (isSelected && !wasEnrolled) {
          await setDoc(docRef, {
            studentId: studentId,
            enrolledAt: Date.now()
          });
        } else if (!isSelected && wasEnrolled) {
          await deleteDoc(docRef);
        }
      }
      setInitialEnrolled(new Set(selectedModuleIds));
      alert("Module selections saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Array.from(selectedModuleIds).sort().join(',') !== Array.from(initialEnrolled).sort().join(',');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Select Modules</h1>
          <p className="mt-1 text-sm text-neutral-400">Select the modules you are doing and save changes to see their updates.</p>
        </div>
        <button
          onClick={saveChanges}
          disabled={!hasChanges || saving}
          className={clsx(
            "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm",
            !hasChanges ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50" : 
            saving ? "bg-blue-600/50 text-white cursor-wait" :
            "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12 text-neutral-400 flex flex-col items-center">
           <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4 text-blue-500" />
           Loading modules...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => {
            const isSelected = selectedModuleIds.has(mod.id);
            return (
              <div 
                key={mod.id} 
                className={clsx(
                  "rounded-xl border transition-all cursor-pointer overflow-hidden relative group",
                  isSelected 
                    ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20" 
                    : "bg-neutral-800 border-neutral-700/60 shadow-sm hover:border-neutral-600 hover:bg-neutral-700"
                )}
                onClick={() => toggleSelection(mod.id)}
              >
                <div className="p-6 flex flex-col h-full z-10 relative">
                   <div className="flex justify-between items-start mb-6">
                      <div className={clsx(
                         "w-12 h-12 flex items-center justify-center rounded-xl shadow-inner",
                         isSelected ? "bg-blue-600 text-white" : "bg-neutral-900 border border-neutral-700/50 text-neutral-400"
                      )}>
                         <BookOpen className="w-6 h-6" />
                      </div>
                      <div className={clsx(
                         "w-7 h-7 flex items-center justify-center rounded-md border",
                         isSelected ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "border-neutral-500 bg-neutral-900 text-transparent"
                      )}>
                         {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                   </div>
                   <h3 className={clsx("text-lg font-bold mb-1", isSelected ? "text-blue-400" : "text-white")}>{mod.name}</h3>
                   <p className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">{mod.code}</p>
                   <p className="text-sm text-neutral-300 line-clamp-3 leading-relaxed flex-1">{mod.description}</p>
                </div>
              </div>
            );
          })}
          {modules.length === 0 && (
            <div className="col-span-full bg-neutral-800 p-8 rounded-xl border border-neutral-700 text-center text-neutral-400">
              No modules available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
