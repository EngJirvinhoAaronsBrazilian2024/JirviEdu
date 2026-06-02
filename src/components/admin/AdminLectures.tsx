import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Video } from 'lucide-react';
import { Module } from '../../types';

export default function AdminLectures() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [lectures, setLectures] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!selectedModule) return;
    const q = query(collection(db, `modules/${selectedModule}/lectures`));
    return onSnapshot(q, snap => setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    const id = `lec_${Date.now()}`;
    await setDoc(doc(db, `modules/${selectedModule}/lectures`, id), {
      title, meetLink, date, time, createdAt: Date.now()
    });
    setTitle(''); setMeetLink(''); setDate(''); setTime('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this lecture?')) {
      await deleteDoc(doc(db, `modules/${selectedModule}/lectures`, id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Lectures Management</h1>
        <p className="mt-1 text-sm text-neutral-500">Schedule video lectures for modules.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Select Module</label>
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">-- Choose Module --</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
        </select>
      </div>

      {selectedModule && (
        <>
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Add New Lecture</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Lecture Title" value={title} onChange={e=>setTitle(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              <input required placeholder="Meet Link (URL)" value={meetLink} onChange={e=>setMeetLink(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              <input required type="time" value={time} onChange={e=>setTime(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              <button type="submit" className="md:col-span-2 flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                <Plus className="w-4 h-4 mr-2" /> Schedule Lecture
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Link</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {lectures.map(lec => (
                  <tr key={lec.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      <div className="flex items-center"><Video className="w-4 h-4 mr-2 text-indigo-500"/>{lec.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{lec.date} at {lec.time}</td>
                    <td className="px-6 py-4 text-sm text-indigo-600 hover:text-indigo-900"><a href={lec.meetLink} target="_blank" rel="noreferrer">Join</a></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(lec.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                    </td>
                  </tr>
                ))}
                {lectures.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">No lectures scheduled.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
