import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs, storage, ref, uploadBytes, getDownloadURL } from '../../lib/db';
import { Plus, Trash2, FileText, Loader2, Users, CheckCircle, ChevronLeft, X, BookOpen, Calendar, Clock, Upload, ArrowRight, Save, Sparkles } from 'lucide-react';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminAssignments({ assignedModules }: { assignedModules?: string[] }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [startTime, setStartTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [marks, setMarks] = useState('50');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'modules'));
    return onSnapshot(q, snap => {
      let mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));
      if (assignedModules) {
        mods = mods.filter(m => assignedModules.includes(m.id));
      }
      setModules(mods);
    });
  }, [assignedModules]);

  useEffect(() => {
    if (!selectedModule) {
      setAssignments([]);
      return;
    }
    const q = query(collection(db, `modules/${selectedModule}/assignments`));
    return onSnapshot(q, snap => setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedModule]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedModule) return;
    
    setUploading(true);
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
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
      
      // Notify all students
      const notifId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'notifications', notifId), {
        userId: 'all',
        title: 'New Assignment Posted',
        message: `A new assignment "${title}" has been posted for module ${modules.find(m => m.id === selectedModule)?.code}.`,
        read: false,
        createdAt: Date.now()
      });

      setAssignments(prev => [...prev, { id, ...newAssignment }]);

      setTitle(''); setDesc(''); setStartTime(''); setDeadline(''); setMarks(''); setFile(null);
      setIsAdding(false);
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(err.message || "Failed to upload assignment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this assignment and all its submissions?')) {
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Assignments Management</h1>
        <p className="mt-2 text-muted font-medium">Create assignments, manage deadlines, and grade student submissions.</p>
      </div>

      {!selectedAssignment && (
        <div className="premium-card p-6 md:p-8">
          <label className="block text-sm font-bold text-[var(--text-main)] mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
            Select Module Context
          </label>
          <div className="relative max-w-xl">
            <select 
              value={selectedModule} 
              onChange={(e) => {setSelectedModule(e.target.value); setSelectedAssignment(null);}} 
              className="block w-full appearance-none rounded-xl border border-[var(--border-strong)] px-4 py-3 bg-[var(--bg-app)] text-[var(--text-main)] font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
            >
              <option value="">-- Choose a module to view assignments --</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedModule && !selectedAssignment && (
          <motion.div
            key="assignments-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center">
                <FileText className="w-5 h-5 mr-3 text-green-500" />
                Active Assignments
                <span className="ml-3 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-500/20 shadow-sm">{assignments.length}</span>
              </h2>
              <button 
                onClick={() => setIsAdding(!isAdding)} 
                className="flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> 
                {isAdding ? 'Cancel' : 'Create Assignment'}
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
                  <div className="premium-card p-6 md:p-8 border border-green-500/20 shadow-green-500/5">
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">New Assignment Details</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Assignment Title</label>
                        <input required placeholder="e.g. Midterm Project: Data Structures" value={title} onChange={e=>setTitle(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Start Time</label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                          <input required type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] pl-9 pr-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Deadline</label>
                        <div className="relative">
                          <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                          <input required type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] pl-9 pr-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Total Marks</label>
                        <input required placeholder="e.g. 50" type="number" min="0" max="50" value={marks} onChange={e=>setMarks(e.target.value)} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Attachment (Optional)</label>
                        <div className="relative">
                          <input type="file" id="assignment-file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                          <label htmlFor="assignment-file" className="flex items-center justify-center w-full rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-2.5 bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] cursor-pointer transition-colors shadow-sm text-sm font-medium">
                            <Upload className="w-4 h-4 mr-2 text-muted" />
                            {file ? <span className="truncate max-w-[200px]">{file.name}</span> : <span>Upload file...</span>}
                          </label>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-sm font-semibold text-[var(--text-main)]">Instructions / Description</label>
                        <textarea required placeholder="Provide clear instructions for the assignment..." value={desc} onChange={e=>setDesc(e.target.value)} rows={4} className="block w-full rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm resize-none"></textarea>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-[var(--border-subtle)] pt-6">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[var(--border-strong)] rounded-xl shadow-sm text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--border-subtle)] transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={uploading} className="flex justify-center items-center px-6 py-2.5 bg-green-600 text-white rounded-xl shadow-sm hover:bg-green-700 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
                          {uploading ? 'Publishing...' : 'Publish Assignment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search assignments by title..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full md:w-1/3 rounded-xl border border-[var(--border-strong)] px-4 py-2.5 placeholder:text-muted focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 text-[var(--text-main)] bg-[var(--bg-app)] transition-all shadow-sm"
              />
            </div>

            <div className="premium-card overflow-hidden">
              {assignments.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
                    <FileText className="w-8 h-8 text-muted opacity-50" />
                  </div>
                  <p className="text-[var(--text-main)] font-semibold text-lg">No assignments posted</p>
                  <p className="text-sm text-muted mt-1 max-w-md">Create your first assignment for this module.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                    <thead className="bg-[var(--bg-app)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Assignment Details</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Timeline</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Marks</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                      {assignments
                        .filter(ast => ast.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(ast => {
                        const isJson = typeof ast.description === 'string' && ast.description.startsWith('{');
                        const data = isJson ? JSON.parse(ast.description) : { text: ast.description, start: ast.createdAt || Date.now() };
                        return (
                        <tr key={ast.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-[var(--text-main)]">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mr-4 shadow-sm border border-green-200 dark:border-green-500/20 shrink-0">
                                <FileText className="w-5 h-5"/>
                              </div>
                              <div>
                                <span className="font-bold text-base block">{ast.title}</span>
                                {ast.fileUrl && (
                                  <a href={ast.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1 inline-flex items-center">
                                    View Attachment
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm hidden sm:table-cell">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center text-muted font-medium text-xs">
                                <span className="w-10 inline-block uppercase font-bold text-[10px] tracking-wider text-green-600 dark:text-green-400">Start:</span>
                                {new Date(data.start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                              <div className="flex items-center text-[var(--text-main)] font-semibold text-xs">
                                <span className="w-10 inline-block uppercase font-bold text-[10px] tracking-wider text-red-500">End:</span>
                                {new Date(ast.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm hidden sm:table-cell">
                            <span className="font-bold text-[var(--text-main)] bg-[var(--bg-app)] border border-[var(--border-strong)] px-2.5 py-1 rounded-lg">
                              {ast.marks} pts
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => setSelectedAssignment(ast)} 
                                className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-transparent dark:border-blue-500/20"
                              >
                                Submissions
                                <ArrowRight className="w-3 h-3 ml-1.5" />
                              </button>
                              <button onClick={() => handleDelete(ast.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedModule && selectedAssignment && (
          <motion.div
            key="submissions-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AssignmentSubmissions 
              moduleId={selectedModule} 
              assignment={selectedAssignment} 
              onBack={() => setSelectedAssignment(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
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

  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<string | null>(null);

  const startGrading = (sub: any) => {
    setGradingId(sub.id);
    setGradeInput(sub.grade?.toString() || '');
    setFeedbackInput(sub.feedback || '');
  };

  const generateFeedback = async (sub: any) => {
    setIsGeneratingFeedback(sub.id);
    try {
      const studentSubmission = sub.type === 'text' ? sub.content : 'Document submission (URL: ' + sub.fileUrl + ')';
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentTitle: assignment.title,
          studentSubmission
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.feedback) {
          setFeedbackInput(data.feedback);
        }
      }
    } catch (err) {
      console.error("Feedback error", err);
      alert("Failed to generate AI feedback.");
    } finally {
      setIsGeneratingFeedback(null);
    }
  };

  const saveGrade = async (studentId: string) => {
    try {
      await updateDoc(doc(db, `modules/${moduleId}/assignments/${assignment.id}/submissions`, studentId), {
        grade: Number(gradeInput) || 0,
        feedback: feedbackInput
      });

      // Notify the specific student
      const notifId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, 'notifications', notifId), {
        userId: studentId,
        title: 'Assignment Graded',
        message: `Your submission for "${assignment.title}" has been graded: ${gradeInput}/${assignment.marks}.`,
        read: false,
        createdAt: Date.now()
      });

      setGradingId(null);
    } catch (e: any) {
      alert("Failed to update grade.");
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-bold text-muted hover:text-[var(--text-main)] flex items-center transition-colors">
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Assignments
      </button>

      <div className="premium-card p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20 shadow-sm mr-3">
              GRADING
            </span>
            <h2 className="text-2xl font-bold text-[var(--text-main)] leading-none">{assignment.title}</h2>
          </div>
          <div className="flex items-center text-sm font-medium text-muted mt-3">
            <span className="flex items-center bg-[var(--bg-app)] px-2.5 py-1 rounded-lg border border-[var(--border-strong)]"><FileText className="w-3.5 h-3.5 mr-1.5 text-green-500"/> {assignment.marks} Total Marks</span>
            <span className="mx-3 text-[var(--border-strong)]">|</span>
            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5"/> Deadline: {new Date(assignment.deadline).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</span>
          </div>
        </div>
        <div className="flex items-center bg-[var(--bg-app)] px-4 py-3 rounded-xl border border-[var(--border-strong)] shadow-inner">
          <Users className="w-5 h-5 text-blue-500 mr-3" />
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">Submissions</p>
            <p className="text-xl font-bold text-[var(--text-main)] leading-none mt-0.5">{submissions.length}</p>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--bg-app)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Submitted At</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Work</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Grade & Feedback</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
            {submissions.map(sub => {
              const student = students[sub.studentId || sub.id] || { fullName: 'Unknown Student', regNumber: sub.studentId || sub.id };
              const isGrading = gradingId === sub.id;
              
              return (
                <tr key={sub.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    <div className="font-bold text-[var(--text-main)] text-base">{student.fullName}</div>
                    <div className="text-xs font-semibold text-muted mt-0.5">{student.regNumber}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-muted font-medium hidden sm:table-cell">
                    {new Date(sub.submittedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm">
                    {sub.type === 'text' ? (
                      <button onClick={() => setViewingContent({name: student.fullName, content: sub.content})} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-bold text-xs transition-colors border border-indigo-200 dark:border-indigo-500/20">
                        <FileText className="w-3.5 h-3.5 mr-1.5"/>
                        Read Answer
                      </button>
                    ) : (
                      <button onClick={() => setViewingFileUrl({name: student.fullName, url: sub.fileUrl})} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-bold text-xs transition-colors border border-blue-200 dark:border-blue-500/20">
                        <FileText className="w-3.5 h-3.5 mr-1.5"/>
                        View Document
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm">
                    {isGrading ? (
                      <div className="space-y-3 bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-strong)] shadow-inner">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            min="0"
                            max={assignment.marks}
                            className="w-24 px-3 py-1.5 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-lg text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                            placeholder={`/ ${assignment.marks}`}
                            value={gradeInput}
                            onChange={e => setGradeInput(e.target.value)}
                            autoFocus
                          />
                          <span className="text-sm font-bold text-muted">/ {assignment.marks}</span>
                        </div>
                        <div className="relative">
                          <textarea 
                            className="w-full px-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-lg text-sm text-[var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" 
                            placeholder="Add feedback for the student..."
                            value={feedbackInput}
                            onChange={e => setFeedbackInput(e.target.value)}
                            rows={3}
                          />
                          <button
                            onClick={() => generateFeedback(sub)}
                            disabled={isGeneratingFeedback === sub.id}
                            title="Generate AI Feedback"
                            className="absolute bottom-2 right-2 p-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/50 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      sub.grade !== undefined ? (
                        <div className="max-w-sm">
                          <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md border border-green-200 dark:border-green-500/20">
                            {sub.grade} / {assignment.marks}
                          </span>
                          {sub.feedback && <p className="mt-2 text-xs font-medium text-muted line-clamp-2 italic border-l-2 border-[var(--border-strong)] pl-2">{sub.feedback}</p>}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20">
                          Needs Grading
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium align-top pt-7">
                    {isGrading ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setGradingId(null)} className="px-3 py-1.5 text-xs font-bold text-muted hover:text-[var(--text-main)] transition-colors">Cancel</button>
                        <button onClick={() => saveGrade(sub.studentId || sub.id)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-xs font-bold transition-colors">
                          <Save className="w-3.5 h-3.5 mr-1.5"/>
                          Save
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startGrading(sub)} 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs"
                      >
                        {sub.grade !== undefined ? 'Edit Grade' : 'Grade Submission'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-10 h-10 text-muted opacity-50 mb-3" />
                    <p className="text-[var(--text-main)] font-semibold text-base">No submissions yet</p>
                    <p className="text-muted text-sm mt-1">Students haven't submitted their work for this assignment.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {viewingContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setViewingContent(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-[var(--border-strong)] overflow-hidden"
            >
              <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-3 font-bold text-lg">
                    {viewingContent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-main)] text-lg leading-tight">{viewingContent.name}</h3>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Text Submission</p>
                  </div>
                </div>
                <button onClick={() => setViewingContent(null)} className="p-2 text-muted hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div 
                className="p-6 md:p-8 overflow-y-auto w-full prose prose-sm md:prose-base prose-neutral dark:prose-invert text-[var(--text-main)]"
                dangerouslySetInnerHTML={{ __html: viewingContent.content }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <FileText className="w-5 h-5 mr-3 text-blue-500" />
                  <div>
                    <h3 className="font-bold text-[var(--text-main)]">Document Viewer</h3>
                    <p className="text-xs text-muted font-medium">{viewingFileUrl.name}'s Submission</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a href={viewingFileUrl.url} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center">
                    <Upload className="w-4 h-4 mr-2 rotate-180" />
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
