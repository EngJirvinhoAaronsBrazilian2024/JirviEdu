import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, FileText, Loader2, Users, CheckCircle, ChevronLeft } from 'lucide-react';
import { Module } from '../../types';

export default function AdminAssignments() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [marks, setMarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as Module))));
  }, []);

  useEffect(() => {
    if (!selectedModule) return;
    const q = query(collection(db, `modules/${selectedModule}/assignments`));
    return onSnapshot(q, snap => setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedModule) return;
    
    const form = e.currentTarget;
    setUploading(true);
    try {
      let fileUrl = '';
      if (file) {
        if (file.size > 800 * 1024) {
          throw new Error("File is too large. Please select a file smaller than 800KB.");
        }
        fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const id = `asn_${Date.now()}`;
      await setDoc(doc(db, `modules/${selectedModule}/assignments`, id), {
        title, description: desc, deadline: new Date(deadline).getTime(), marks: Number(marks), fileUrl, createdAt: Date.now()
      });
      setTitle(''); setDesc(''); setDeadline(''); setMarks(''); setFile(null);
      form.reset();
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(err.message || "Failed to upload assignment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this assignment?')) {
      await deleteDoc(doc(db, `modules/${selectedModule}/assignments`, id));
      if (selectedAssignment?.id === id) setSelectedAssignment(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Assignments Management</h1>
        <p className="mt-1 text-sm text-neutral-500">Create assignments for modules and grade submissions.</p>
      </div>

      {!selectedAssignment && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Select Module</label>
          <select value={selectedModule} onChange={(e) => {setSelectedModule(e.target.value); setSelectedAssignment(null);}} className="w-full border border-neutral-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">-- Choose Module --</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
          </select>
        </div>
      )}

      {selectedModule && !selectedAssignment && (
        <>
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Add New Assignment</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Assignment Title" value={title} onChange={e=>setTitle(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm" />
              <input required placeholder="Total Marks" type="number" min="0" value={marks} onChange={e=>setMarks(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm" />
              <input required placeholder="Deadline" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm" />
              <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-neutral-300 rounded-md p-2 text-sm" />
              <textarea required placeholder="Instructions / Description" value={desc} onChange={e=>setDesc(e.target.value)} className="border border-neutral-300 rounded-md p-2 text-sm md:col-span-2" rows={3}></textarea>
              <button type="submit" disabled={uploading} className="md:col-span-2 flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                {uploading ? 'Uploading & Publishing...' : 'Publish Assignment'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Marks</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {assignments.map(ast => (
                  <tr key={ast.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      <div className="flex items-center"><FileText className="w-4 h-4 mr-2 text-green-500"/>{ast.title}</div>
                      {ast.fileUrl && <a href={ast.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">View Attachment</a>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(ast.deadline).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{ast.marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => setSelectedAssignment(ast)} className="text-indigo-600 hover:text-indigo-900 font-medium">Submissions</button>
                      <button onClick={() => handleDelete(ast.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline"/></button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500">No assignments posted.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedModule && selectedAssignment && (
        <AssignmentSubmissions 
          moduleId={selectedModule} 
          assignment={selectedAssignment} 
          onBack={() => setSelectedAssignment(null)} 
        />
      )}
    </div>
  );
}

function AssignmentSubmissions({ moduleId, assignment, onBack }: { moduleId: string, assignment: any, onBack: () => void }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, any>>({});
  
  // Grading state
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [viewingContent, setViewingContent] = useState<string | null>(null);

  useEffect(() => {
    // Fetch students list to map IDs to Names
    const qS = query(collection(db, 'students'));
    const unsubS = onSnapshot(qS, snap => {
      const sMap: Record<string, any> = {};
      snap.docs.forEach(d => sMap[d.id] = d.data());
      setStudents(sMap);
    });

    const q = query(collection(db, `modules/${moduleId}/assignments/${assignment.id}/submissions`));
    const unsub = onSnapshot(q, snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubS(); unsub(); };
  }, [moduleId, assignment.id]);

  const startGrading = (sub: any) => {
    setGradingId(sub.id);
    setGradeInput(sub.grade?.toString() || '');
    setFeedbackInput(sub.feedback || '');
  };

  const saveGrade = async (studentId: string) => {
    try {
      await updateDoc(doc(db, `modules/${moduleId}/assignments/${assignment.id}/submissions`, studentId), {
        grade: Number(gradeInput) || 0,
        feedback: feedbackInput
      });
      setGradingId(null);
    } catch (e: any) {
      alert("Failed to update grade.");
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Assignments
      </button>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{assignment.title}</h2>
          <p className="text-sm text-neutral-500 mt-1">Total Marks: {assignment.marks} • Deadline: {new Date(assignment.deadline).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-neutral-900">{submissions.length} Submissions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">File/Text</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Grade & Feedback</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {submissions.map(sub => {
              const student = students[sub.id] || { fullName: 'Unknown Student', regNumber: sub.id };
              const isGrading = gradingId === sub.id;
              
              return (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    <div>{student.fullName}</div>
                    <div className="text-xs text-neutral-500">{student.regNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sub.type === 'text' ? (
                      <button onClick={() => setViewingContent(sub.content)} className="text-indigo-600 hover:underline">Read Answer</button>
                    ) : (
                      <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Work</a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {isGrading ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 border border-neutral-300 rounded-md text-sm" 
                            placeholder={`/ ${assignment.marks}`}
                            value={gradeInput}
                            onChange={e => setGradeInput(e.target.value)}
                            autoFocus
                          />
                          <span className="text-xs text-neutral-500">/ {assignment.marks}</span>
                        </div>
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 border border-neutral-300 rounded-md text-sm" 
                          placeholder="Add feedback..."
                          value={feedbackInput}
                          onChange={e => setFeedbackInput(e.target.value)}
                        />
                      </div>
                    ) : (
                      sub.grade !== undefined ? (
                        <div className="max-w-sm truncate">
                          <span className="font-bold text-neutral-900">{sub.grade}/{assignment.marks}</span>
                          {sub.feedback && <span className="ml-2 text-xs text-neutral-500 line-clamp-1">{sub.feedback}</span>}
                        </div>
                      ) : (
                        <span className="text-amber-500 italic">Not graded</span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isGrading ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setGradingId(null)} className="text-neutral-500 hover:text-neutral-700">Cancel</button>
                        <button onClick={() => saveGrade(sub.id)} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startGrading(sub)} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {sub.grade !== undefined ? 'Edit Grade' : 'Grade'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {submissions.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingContent && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="font-bold text-neutral-900">Online Answer</h3>
              <button onClick={() => setViewingContent(null)} className="text-neutral-500 hover:text-neutral-700">
                <ChevronLeft className="w-5 h-5 hidden" />
                Close
              </button>
            </div>
            <div 
              className="p-6 overflow-y-auto w-full prose text-sm text-neutral-800 font-medium"
              dangerouslySetInnerHTML={{ __html: viewingContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
