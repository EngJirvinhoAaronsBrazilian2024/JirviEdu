import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, setDoc, deleteDoc, storage, ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Plus, Trash2, FileDown, Loader2 } from 'lucide-react';
import { Module } from '../../types';

export default function AdminMaterials() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!selectedModule) return;
    const q = query(collection(db, `modules/${selectedModule}/learningMaterials`));
    return onSnapshot(q, snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedModule || !file) return;
    
    const form = e.currentTarget;
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
      form.reset();
    } catch(err: any) {
      console.error("Upload material failed", err);
      alert(err.message || "Failed to upload material.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this material?')) {
      await deleteDoc(doc(db, `modules/${selectedModule}/learningMaterials`, id));
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">Learning Materials</h1>
        <p className="mt-1 text-sm text-neutral-400">Upload notes, slides, and files.</p>
      </div>

      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
        <label className="block text-sm font-medium text-neutral-200 mb-2">Select Module</label>
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full border border-neutral-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
          <option value="">-- Choose Module --</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
        </select>
      </div>

      {selectedModule && (
        <>
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-50 mb-4">Add Material</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Title / Description" value={title} onChange={e=>setTitle(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm" />
              <input required type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-neutral-600 rounded-md p-2 text-sm" />
              <button type="submit" disabled={uploading || !file} className="md:col-span-2 flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </form>
          </div>

          <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Link</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {materials.map(mat => (
                  <tr key={mat.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-50">
                      <div className="flex items-center"><FileDown className="w-4 h-4 mr-2 text-blue-500"/>{mat.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-900"><a href={mat.fileUrl} target="_blank" rel="noreferrer">Download / View</a></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(mat.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-neutral-400">No materials uploaded.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
