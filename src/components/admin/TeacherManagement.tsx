import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from '../../lib/db';
import { hash } from 'bcrypt-ts';
import { Plus, Trash2, Edit2, Loader2, X, CheckCircle, Shield } from 'lucide-react';
import { Teacher, Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import MultiSelect from './MultiSelect';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedModules, setAssignedModules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubT = onSnapshot(collection(db, 'teachers'), (snap) => {
      const data: Teacher[] = [];
      snap.forEach(d => {
        data.push({ id: d.id, ...d.data() } as Teacher);
      });
      setTeachers(data);
      setLoading(false);
    });

    const unsubM = onSnapshot(collection(db, 'modules'), (snap) => {
      const data: Module[] = [];
      snap.forEach(d => {
        data.push({ id: d.id, ...d.data() } as Module);
      });
      setModules(data);
    });

    return () => { unsubT(); unsubM(); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingTeacher) {
        await setDoc(doc(db, 'teachers', editingTeacher.id), {
          ...editingTeacher,
          fullName,
          email,
          assignedModules
        }, { merge: true });
        
        if (password) {
          const passwordHash = await hash(password, 10);
          await setDoc(doc(db, 'teacher_passwords', editingTeacher.id), { passwordHash });
        }
      } else {
        const id = 'tea_' + Date.now().toString(36);
        const regNumber = `TEA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const teacher: Teacher = {
          id,
          regNumber,
          fullName,
          email,
          assignedModules,
          status: 'active',
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'teachers', id), teacher);
        const passwordHash = await hash(password || 'password123', 10);
        await setDoc(doc(db, 'teacher_passwords', id), { passwordHash });
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error saving teacher.');
    } finally {
      setIsSaving(false);
    }
  };

  const openAdd = () => {
    setEditingTeacher(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setAssignedModules([]);
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFullName(t.fullName);
    setEmail(t.email);
    setPassword('');
    setAssignedModules(t.assignedModules || []);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this teacher permanently?')) {
      await deleteDoc(doc(db, 'teachers', id));
      await deleteDoc(doc(db, 'teacher_passwords', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-strong)] shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Teachers</h1>
          <p className="mt-2 text-muted font-medium">Manage teacher accounts and module assignments.</p>
        </div>
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 text-sm font-bold transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Add Teacher
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-strong)] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--bg-app)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Reg Number</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Assigned Modules</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto"/></td></tr>
            ) : teachers.map(t => (
              <tr key={t.id} className="hover:bg-[var(--bg-app)] transition-colors">
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-[var(--text-main)]">{t.fullName}</div>
                  <div className="text-xs font-medium text-muted">{t.email}</div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {t.regNumber}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {t.assignedModules && t.assignedModules.length > 0 ? (
                      t.assignedModules.map(mid => {
                        const m = modules.find(x => x.id === mid);
                        return m ? (
                          <span key={mid} className="px-2 py-1 bg-[var(--bg-app)] border border-[var(--border-strong)] rounded text-xs font-bold text-muted">
                            {m.code}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-xs text-muted font-medium italic">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 font-bold">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 font-bold">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && teachers.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted">No teachers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg overflow-visible border border-[var(--border-strong)] shadow-2xl">
              <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-app)] rounded-t-2xl">
                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-500"/>
                  {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted hover:text-[var(--text-main)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1">Full Name</label>
                  <input type="text" required value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-xl text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1">Email</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-xl text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-1">{editingTeacher ? 'New Password (Optional)' : 'Password'}</label>
                  <input type={editingTeacher ? 'text' : 'password'} required={!editingTeacher} value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-xl text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Assign Modules</label>
                  <MultiSelect 
                    options={modules.map(m => ({ id: m.id, label: `${m.code} - ${m.name}` }))} 
                    selectedIds={assignedModules} 
                    onChange={setAssignedModules} 
                    placeholder="Search and select modules..."
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 font-bold text-muted hover:text-[var(--text-main)]">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
