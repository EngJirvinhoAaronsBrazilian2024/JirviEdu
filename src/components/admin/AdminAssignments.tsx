import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, storage, ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Plus, Trash2, FileText, Loader2, Users, CheckCircle, ChevronLeft, X } from 'lucide-react';
import { Module } from '../../types';

export default function AdminAssignments() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startTime, setStartTime] = useState('');
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
      const id = crypto.randomUUID();
      let fileUrl = '';
      if (file) {
        const fileRef = ref(storage, `assignments/${id}_${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
      }

      const payloadDesc = JSON.stringify({ text: desc, start: new Date(startTime).getTime() });

      const newAssignment = {
        title, description: payloadDesc, deadline: new Date(deadline).getTime(), marks: Number(marks), fileUrl, createdAt: Date.now()
      };
      await setDoc(doc(db, `modules/${selectedModule}/assignments`, id), newAssignment);
      
      setAssignments(prev => [...prev, { id, ...newAssignment }]);

      setTitle(''); setDesc(''); setStartTime(''); setDeadline(''); setMarks(''); setFile(null);
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
      try {
        const subsSnap = await getDocs(collection(db, `modules/${selectedModule}/assignments/${id}/submissions`));
        for (const subDoc of subsSnap.docs) {
          await deleteDoc(doc(db, `modules/${selectedModule}/assignments/${id}/submissions`, subDoc.id));
        }
        await deleteDoc(doc(db, `modules/${selectedModule}/assignments`, id));
        setAssignments(prev => prev.filter(ast => ast.id !== id));
        if (selectedAssignment?.id === id) setSelectedAssignment(null);
      } catch (err: any) {
        alert(err.message || "Failed to delete assignment.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">Assignments Management</h1>
        <p className="mt-1 text-sm text-neutral-400">Create assignments for modules and grade submissions.</p>
      </div>

      {!selectedAssignment && (
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
          <label className="block text-sm font-medium text-neutral-200 mb-2">Select Module</label>
          <select value={selectedModule} onChange={(e) => {setSelectedModule(e.target.value); setSelectedAssignment(null);}} className="w-full border border-neutral-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">-- Choose Module --</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
          </select>
        </div>
      )}

      {selectedModule && !selectedAssignment && (
        <>
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm">
            <h2 className="text-lg font-medium text-neutral-50 mb-4">Add New Assignment</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Assignment Title" value={title} onChange={e=>setTitle(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm md:col-span-2" />
              <input required placeholder="Total Marks" type="number" min="0" value={marks} onChange={e=>setMarks(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm" />
              <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-neutral-600 rounded-md p-2 text-sm" title="Assignment File (Optional)" />
              <div className="flex flex-col">
                <label className="text-xs text-neutral-400 mb-1">Start Time</label>
                <input required type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm w-full" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-neutral-400 mb-1">Deadline</label>
                <input required type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm w-full" />
              </div>
              <textarea required placeholder="Instructions / Description" value={desc} onChange={e=>setDesc(e.target.value)} className="border border-neutral-600 rounded-md p-2 text-sm md:col-span-2" rows={3}></textarea>
              <button type="submit" disabled={uploading} className="md:col-span-2 flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                {uploading ? 'Uploading & Publishing...' : 'Publish Assignment'}
              </button>
            </form>
          </div>

          <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-700">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Timing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Marks</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {assignments.map(ast => {
                  const isJson = typeof ast.description === 'string' && ast.description.startsWith('{');
                  const data = isJson ? JSON.parse(ast.description) : { text: ast.description, start: ast.createdAt || Date.now() };
                  return (
                  <tr key={ast.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-50">
                      <div className="flex items-center"><FileText className="w-4 h-4 mr-2 text-green-500"/>{ast.title}</div>
                      {ast.fileUrl && <a href={ast.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">View Attachment</a>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                      <div><span className="text-neutral-500 text-xs">Start:</span> {new Date(data.start).toLocaleString()}</div>
                      <div><span className="text-neutral-500 text-xs">End:</span> {new Date(ast.deadline).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">{ast.marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => setSelectedAssignment(ast)} className="text-blue-400 hover:text-blue-300 font-medium">Submissions</button>
                      <button onClick={() => handleDelete(ast.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4 inline"/></button>
                    </td>
                  </tr>
                )})}
                {assignments.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-400">No assignments posted.</td></tr>}
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
  const [viewingContent, setViewingContent] = useState<{name: string, content: string} | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<{name: string, url: string} | null>(null);

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
      <button onClick={onBack} className="text-sm font-medium text-blue-400 hover:text-blue-800 flex items-center">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Assignments
      </button>

      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-50">{assignment.title}</h2>
          <p className="text-sm text-neutral-400 mt-1">Total Marks: {assignment.marks} • Deadline: {new Date(assignment.deadline).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-neutral-50">{submissions.length} Submissions</p>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-700">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">File/Text</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Grade & Feedback</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {submissions.map(sub => {
              const student = students[sub.studentId || sub.id] || { fullName: 'Unknown Student', regNumber: sub.studentId || sub.id };
              const isGrading = gradingId === sub.id;
              
              return (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-50">
                    <div>{student.fullName}</div>
                    <div className="text-xs text-neutral-400">{student.regNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sub.type === 'text' ? (
                      <button onClick={() => setViewingContent({name: student.fullName, content: sub.content})} className="text-blue-400 hover:underline">Read Answer</button>
                    ) : (
                      <button onClick={() => setViewingFileUrl({name: student.fullName, url: sub.fileUrl})} className="text-blue-400 hover:underline">View Work</button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {isGrading ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 border border-neutral-600 rounded-md text-sm" 
                            placeholder={`/ ${assignment.marks}`}
                            value={gradeInput}
                            onChange={e => setGradeInput(e.target.value)}
                            autoFocus
                          />
                          <span className="text-xs text-neutral-400">/ {assignment.marks}</span>
                        </div>
                        <input 
                          type="text" 
                          className="w-full px-2 py-1 border border-neutral-600 rounded-md text-sm" 
                          placeholder="Add feedback..."
                          value={feedbackInput}
                          onChange={e => setFeedbackInput(e.target.value)}
                        />
                      </div>
                    ) : (
                      sub.grade !== undefined ? (
                        <div className="max-w-sm truncate">
                          <span className="font-bold text-neutral-50">{sub.grade}/{assignment.marks}</span>
                          {sub.feedback && <span className="ml-2 text-xs text-neutral-400 line-clamp-1">{sub.feedback}</span>}
                        </div>
                      ) : (
                        <span className="text-amber-500 italic">Not graded</span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isGrading ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setGradingId(null)} className="text-neutral-400 hover:text-neutral-200">Cancel</button>
                        <button onClick={() => saveGrade(sub.studentId || sub.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startGrading(sub)} 
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {sub.grade !== undefined ? 'Edit Grade' : 'Grade'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {submissions.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-400">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingContent && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
              <h3 className="font-bold text-neutral-50">Online Answer: {viewingContent.name}</h3>
              <button onClick={() => setViewingContent(null)} className="text-neutral-400 hover:text-neutral-200">
                <ChevronLeft className="w-5 h-5 hidden" />
                Close
              </button>
            </div>
            <div 
              className="p-6 overflow-y-auto w-full prose text-sm text-neutral-200 font-medium prose-invert"
              dangerouslySetInnerHTML={{ __html: viewingContent.content }}
            />
          </div>
        </div>
      )}

      {viewingFileUrl && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-5xl w-full h-[90vh] flex flex-col border border-neutral-700">
            <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
              <h3 className="font-bold text-neutral-50 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-400" />
                Document: {viewingFileUrl.name}
              </h3>
              <div className="flex items-center space-x-3">
                <a href={viewingFileUrl.url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 bg-neutral-700 text-neutral-200 hover:bg-neutral-600 rounded">
                  Download File
                </a>
                <button onClick={() => setViewingFileUrl(null)} className="text-neutral-400 hover:text-neutral-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingFileUrl.url)}&embedded=true`} 
                className="w-full h-full border-0 bg-white" 
                title="Document Preview" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
