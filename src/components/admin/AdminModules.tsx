import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from '../../lib/db';
import { Plus, Trash2, BookOpen, LayoutGrid, Search } from 'lucide-react';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setModules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    const newMod = { name, code, description: desc, createdAt: Date.now() };
    await setDoc(doc(db, 'modules', id), newMod);
    setModules(prev => [...prev, { id, ...newMod } as Module]);
    setName(''); setCode(''); setDesc('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this module permanently?')) {
      await deleteDoc(doc(db, 'modules', id));
      setModules(prev => prev.filter(m => m.id !== id));
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Modules Management</h1>
          <p className="mt-2 text-muted font-medium">Create and manage courses and modules.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search modules..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[var(--border-strong)] rounded-xl text-sm bg-[var(--bg-app)] text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64 shadow-inner transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            {isAdding ? 'Cancel' : 'Add Module'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="premium-card p-6 md:p-8 border border-blue-500/20 shadow-blue-500/5">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center">
                <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
                Create New Module
              </h2>
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Module Code</label>
                  <input required placeholder="e.g. CS101" value={code} onChange={e=>setCode(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                </div>
                <div className="md:col-span-8">
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Module Name</label>
                  <input required placeholder="Introduction to Computer Science" value={name} onChange={e=>setName(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                </div>
                <div className="md:col-span-12">
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1.5">Description</label>
                  <textarea required placeholder="Brief description of the module content..." value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm resize-none" />
                </div>
                <div className="md:col-span-12 flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex justify-center items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 text-sm font-semibold transition-all">
                    Save Module
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="premium-card overflow-hidden">
        {filteredModules.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <LayoutGrid className="w-12 h-12 text-muted opacity-50 mb-4" />
            <p className="text-[var(--text-main)] font-semibold text-lg">No modules found</p>
            <p className="text-sm text-muted mt-1">Get started by creating a new module.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-subtle)]">
              <thead className="bg-[var(--bg-app)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Module Code</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                {filteredModules.map(mod => (
                  <tr key={mod.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20">{mod.code}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-[var(--text-main)]">{mod.name}</td>
                    <td className="px-6 py-5 text-sm text-muted font-medium hidden md:table-cell max-w-md truncate">{mod.description}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(mod.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
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
    </div>
  );
}
