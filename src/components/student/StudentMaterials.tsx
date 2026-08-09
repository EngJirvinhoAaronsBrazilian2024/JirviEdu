import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, getDocs, doc, getDoc, mutationEmitter } from '../../lib/db';
import { FileDown, BookOpen, Download, FolderArchive, X, Eye } from 'lucide-react';
import { Module } from '../../types';
import { logActivity } from '../../lib/activity-logger';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function StudentMaterials({ studentId }: { studentId: string }) {
  const [materials, setMaterials] = useState<{mod: Module, mat: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [viewingFileUrl, setViewingFileUrl] = useState<{name: string, url: string} | null>(null);

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
        
        // Sort newest first
        const sorted = allMats.sort((a,b) => (b.mat.createdAt || 0) - (a.mat.createdAt || 0));
        const newHash = JSON.stringify(sorted);
        if (newHash !== lastHash) {
          setMaterials(sorted);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
        setLoading(false);
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

  // Extract unique enrolled modules for filter dropdown
  const uniqueModules = Array.from(new Set(materials.map(m => m.mod.id)))
    .map(id => materials.find(m => m.mod.id === id)?.mod)
    .filter(Boolean) as Module[];

  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.mat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.mod.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.mod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModuleFilter === 'all' || item.mod.id === selectedModuleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-purple-500" />
            Learning Resources
          </h1>
          <p className="mt-2 text-muted font-medium max-w-2xl">
            Access and download course notes, lecture slides, and supplementary materials.
          </p>
        </div>
      </div>

      <div className="premium-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by title, module code, or module name..."
            className="block w-full pl-10 pr-3 py-2.5 border border-[var(--border-strong)] rounded-xl leading-5 bg-[var(--bg-app)] text-[var(--text-main)] placeholder-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors shadow-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 relative shrink-0">
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="block w-full appearance-none pl-3 pr-10 py-2.5 border border-[var(--border-strong)] rounded-xl leading-5 bg-[var(--bg-app)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors shadow-sm font-bold cursor-pointer"
          >
            <option value="all">All Enrolled Modules</option>
            {uniqueModules.map(mod => (
              <option key={mod.id} value={mod.id}>{mod.code} - {mod.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted">
             <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--text-main)] font-semibold">Loading resources...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)]">
              <thead className="bg-[var(--bg-app)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Resource Information</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Module Context</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden md:table-cell">Upload Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                {filteredMaterials.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-app)] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 shadow-sm border border-purple-200 dark:border-purple-500/20 shrink-0">
                          <FileDown className="w-5 h-5"/>
                        </div>
                        <div>
                          <div className="text-base font-bold text-[var(--text-main)] mb-1 group-hover:text-purple-500 transition-colors">{item.mat.title}</div>
                          <div className="text-xs font-medium text-muted sm:hidden">
                            {item.mod.code} - {item.mod.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-app)] border border-[var(--border-strong)] text-muted w-fit shadow-sm">
                          {item.mod.code}
                        </span>
                        <span className="text-sm font-medium text-[var(--text-main)] truncate max-w-[200px]" title={item.mod.name}>
                          {item.mod.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-muted font-medium hidden md:table-cell">
                      {item.mat.createdAt ? new Date(item.mat.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => {
                          logActivity('Material Viewed', `Viewed ${item.mat.title} for ${item.mod.code}`, studentId, 'student');
                          setViewingFileUrl({ name: item.mat.title, url: item.mat.fileUrl });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm font-bold rounded-xl shadow-sm hover:bg-[var(--bg-app)] hover:border-purple-500/50 hover:text-purple-500 transition-all active:scale-95"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </button>
                      <a 
                        href={item.mat.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={() => logActivity('Material Downloaded', `Downloaded ${item.mat.title} for ${item.mod.code}`, studentId, 'student')}
                        className="inline-flex items-center px-4 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm font-bold rounded-xl shadow-sm hover:bg-[var(--bg-app)] hover:border-purple-500/50 hover:text-purple-500 transition-all active:scale-95 group/btn"
                      >
                        Download 
                        <Download className="w-4 h-4 ml-2 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-y-0.5 transition-transform" />
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-subtle)]">
                        <FolderArchive className="w-8 h-8 text-muted opacity-50" />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-main)]">No resources found</h3>
                      <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
                        {materials.length === 0 
                          ? "No learning materials have been uploaded for your enrolled modules yet." 
                          : "No materials match your current search criteria."}
                      </p>
                      {materials.length > 0 && (
                        <button 
                          onClick={() => {setSearchQuery(''); setSelectedModuleFilter('all')}}
                          className="mt-4 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded-lg text-sm font-bold text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {viewingFileUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setViewingFileUrl(null)}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col border border-[var(--border-strong)] overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-app)]">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-3 text-purple-500" />
                  <div>
                    <h3 className="font-bold text-[var(--text-main)]">Document Viewer</h3>
                    <p className="text-xs text-muted font-medium">{viewingFileUrl.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a href={viewingFileUrl.url} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 bg-purple-600 text-white font-bold hover:bg-purple-700 rounded-xl shadow-sm transition-colors flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download Original
                  </a>
                  <button onClick={() => setViewingFileUrl(null)} className="p-2 text-muted hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] rounded-xl transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full bg-[#f8f9fa] dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingFileUrl.url)}&embedded=true`} 
                  className="w-full h-full border-0" 
                  title="Document Preview" 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
