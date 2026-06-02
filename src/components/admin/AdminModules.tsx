import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { Module } from '../../types';

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setModules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `mod_${Date.now()}`;
    await setDoc(doc(db, 'modules', id), {
      name, code, description: desc, createdAt: Date.now()
    });
    setName(''); setCode(''); setDesc('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this module?')) {
      await deleteDoc(doc(db, 'modules', id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Modules Management</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage courses and modules.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Add New Module</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Module Code (e.g. CS101)" value={code} onChange={e=>setCode(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          <input required placeholder="Module Name" value={name} onChange={e=>setName(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          <input required placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="md:col-span-3 flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" /> Add Module
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {modules.map(mod => (
              <tr key={mod.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{mod.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{mod.name}</td>
                <td className="px-6 py-4 text-sm text-neutral-500">{mod.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(mod.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
