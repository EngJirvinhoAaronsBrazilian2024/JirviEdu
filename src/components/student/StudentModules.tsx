import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs } from '../../lib/db';
import { BookOpen, Check, Save, Loader2, Lock, Plus, CheckCircle, GraduationCap } from 'lucide-react';
import clsx from 'clsx';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

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
    if (initialEnrolled.has(moduleId)) return;
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
      // Optionally show a toast here instead of alert
    } catch (err: any) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Array.from(selectedModuleIds).sort().join(',') !== Array.from(initialEnrolled).sort().join(',');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
            <GraduationCap className="w-8 h-8 mr-3 text-indigo-500" />
            Module Registration
          </h1>
          <p className="mt-2 text-muted font-medium max-w-2xl">
            Select the modules you want to enroll in for this semester. Enrolled modules are locked.
          </p>
        </div>
        
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
            >
              <button
                onClick={saveChanges}
                disabled={saving}
                className={clsx(
                  "flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                  saving 
                    ? "bg-indigo-600/50 text-white cursor-wait" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20 hover:shadow-lg active:scale-95"
                )}
              >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                {saving ? 'Saving Enrollments...' : 'Confirm Registration'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-[var(--text-main)] font-semibold">Loading curriculum...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {modules.map((mod, index) => {
              const isSelected = selectedModuleIds.has(mod.id);
              const isLocked = initialEnrolled.has(mod.id);
              
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    "premium-card rounded-2xl transition-all duration-300 relative group overflow-hidden border-2",
                    isLocked 
                      ? "border-green-500/30 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5 cursor-default shadow-sm" 
                      : isSelected 
                        ? "border-indigo-500 shadow-[0_8px_30px_rgba(99,102,241,0.15)] bg-indigo-50/50 dark:bg-indigo-500/10 cursor-pointer" 
                        : "border-transparent cursor-pointer hover:border-indigo-500/30 hover:shadow-md"
                  )}
                  onClick={() => toggleSelection(mod.id)}
                >
                  <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        isLocked 
                          ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400" 
                          : isSelected 
                            ? "bg-indigo-600 text-white shadow-indigo-500/30" 
                            : "bg-[var(--bg-app)] border border-[var(--border-strong)] text-muted"
                      )}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isLocked 
                          ? "bg-green-500 text-white shadow-sm" 
                          : isSelected 
                            ? "bg-indigo-600 text-white shadow-sm scale-110" 
                            : "bg-[var(--bg-app)] border-2 border-[var(--border-strong)] text-transparent group-hover:border-indigo-500/30"
                      )}>
                        {isLocked ? <Lock className="w-4 h-4" /> : isSelected && <Check className="w-5 h-5" />}
                        {!isLocked && !isSelected && <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-indigo-500/50 transition-opacity" />}
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3",
                        isLocked 
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" 
                          : isSelected 
                            ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" 
                            : "bg-[var(--bg-app)] text-muted border border-[var(--border-strong)]"
                      )}>
                        {mod.code}
                      </span>
                      <h3 className={clsx(
                        "text-xl font-bold mb-3 line-clamp-2",
                        isSelected || isLocked ? "text-[var(--text-main)]" : "text-[var(--text-main)]"
                      )}>
                        {mod.name}
                      </h3>
                      <p className="text-sm text-muted line-clamp-3 font-medium leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    {isLocked && (
                      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                        <CheckCircle className="w-32 h-32 text-green-500 -mr-8 -mt-8" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {modules.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                <BookOpen className="w-8 h-8 text-muted opacity-50" />
              </div>
              <p className="text-[var(--text-main)] font-semibold text-lg">No modules available</p>
              <p className="text-sm text-muted mt-1 text-center max-w-md">There are currently no modules available for enrollment. Please check back later.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
