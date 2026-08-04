import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, setDoc, deleteDoc, storage, ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Plus, Trash2, FileDown, Loader2, BookOpen, Upload, FileText, ArrowDownToLine, LayoutGrid } from 'lucide-react';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminMaterials() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!selectedModule) {
      setMaterials([]);
      return;
    }
    const q = query(collection(db, `modules/${selectedModule}/learningMaterials`));
    return onSnapshot(q, snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedModule || !file) return;
    
    setUploading(true);
    try {
      const id = crypto.randomUUID();
      const fileRef = ref(storage, `materials/${id}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const newMat = { title, fileUrl, createdAt: Date.now() };
      await setDoc(doc(db, `modules/${selectedModule}/learningMaterials`, id), newMat);
      setMaterials(prev => [...prev, { id, ...newMat }]);
      setTitle(''); setFile(null);
      setIsAdding(false);
    } catch(err: any) {
      console.error("Upload material failed", err);
      alert(err.message || "Failed to upload material.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this learning material?')) {
      await deleteDoc(doc(db, `modules/${selectedModule}/learningMaterials`, id));
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Learning Materials</h1>
          <p className="mt-2 text-muted font-medium">Upload and manage course notes, slides, and resources.</p>
        </div>
      </div>

      <div className="premium-card p-6 md:p-8">
        <label className="block text-sm font-bold text-[var(--text-main)] mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
          Select Module Context
        </label>
        <div className="relative max-w-xl">
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)} 
            className="block w-full appearance-none rounded-xl border border-[var(--border-strong)] px-4 py-3 bg-[var(--bg-app)] text-[var(--text-main)] font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="">-- Choose a module to view resources --</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedModule && (
          <motion.div
            key="materials-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center">
                <FileText className="w-5 h-5 mr-3 text-purple-500" />
                Available Resources
                <span className="ml-3 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-sm font-bold border border-purple-200 dark:border-purple-500/20 shadow-sm">{materials.length}</span>
              </h2>
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                className="flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> 
                {isAdding ? 'Cancel' : 'Upload Resource'}
              </button>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="overflow-hidden"
                >
                  <div className="premium-card p-6 md:p-8 border border-purple-500/20 shadow-purple-500/5">
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Upload New Resource</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Document Title / Description</label>
                        <input required placeholder="e.g. Week 1 Lecture Slides" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">File Attachment</label>
                        <div className="relative h-full">
                          <input required type="file" id="material-file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                          <label htmlFor="material-file" className="flex items-center justify-center w-full h-[46px] rounded-xl border border-dashed border-[var(--border-strong)] px-4 bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] cursor-pointer transition-colors shadow-sm text-sm font-medium">
                            <Upload className="w-4 h-4 mr-2 text-muted" />
                            {file ? <span className="truncate max-w-[200px]">{file.name}</span> : <span>Choose file to upload...</span>}
                          </label>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-[var(--border-subtle)] pt-6">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={uploading || !file} className="flex justify-center items-center px-6 py-2.5 bg-purple-600 text-white rounded-xl shadow-sm hover:bg-purple-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                          {uploading ? 'Uploading...' : 'Publish Material'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="premium-card overflow-hidden">
              {materials.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                    <LayoutGrid className="w-8 h-8 text-muted opacity-50" />
                  </div>
                  <p className="text-[var(--text-main)] font-semibold text-lg">No materials uploaded</p>
                  <p className="text-sm text-muted mt-1 max-w-md">Provide learning resources, syllabus, or lecture slides for this module.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                    <thead className="bg-[var(--bg-app)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Document Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Access Link</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                      {materials.map(mat => (
                        <tr key={mat.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-[var(--text-main)]">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 shadow-sm border border-purple-200 dark:border-purple-500/20 shrink-0">
                                <FileDown className="w-5 h-5"/>
                              </div>
                              <span className="font-bold text-base">{mat.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm">
                            <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-bold text-xs transition-colors border border-blue-200 dark:border-blue-500/20">
                              <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5"/>
                              Download / View
                            </a>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDelete(mat.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
