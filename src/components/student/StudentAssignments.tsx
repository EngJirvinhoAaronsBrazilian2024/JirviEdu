import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, doc, setDoc, getDoc, storage, ref, uploadBytes, getDownloadURL, mutationEmitter } from '../../lib/db';
import { FileText, Clock, Upload, CheckCircle, Loader2, Edit3, X, Send, Download, Check, AlertCircle, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Module } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const CountdownTimer = ({ targetTime, onExpire }: { targetTime: number, onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
  const onExpireRef = React.useRef(onExpire);
  
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const int = setInterval(() => {
      const remaining = targetTime - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(int);
        if (onExpireRef.current) onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(int);
  }, [targetTime]);

  if (timeLeft <= 0) return <span>00:00:00</span>;

  const m = Math.floor(timeLeft / 1000 / 60);
  const s = Math.floor((timeLeft / 1000) % 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return <span>{h.toString().padStart(2, '0')}:{mm.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

const RichTextEditor = ({ value, onChange, onFocus }: { value: string, onChange: (v: string) => void, onFocus?: () => void }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const isInternalChange = React.useRef(false);
  const [showTableMenu, setShowTableMenu] = React.useState(false);
  const [tableRows, setTableRows] = React.useState(2);
  const [tableCols, setTableCols] = React.useState(3);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!isInternalChange.current) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    isInternalChange.current = true;
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isInternalChange.current = true;
    onChange(e.currentTarget.innerHTML);
  };

  const insertTable = () => {
    let rowsHtml = '';
    for (let r = 0; r < tableRows; r++) {
      rowsHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        rowsHtml += '<td style="border: 1px solid var(--border-strong); padding: 8px;">&nbsp;</td>';
      }
      rowsHtml += '</tr>';
    }
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 1rem;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table><br/>
    `;
    exec('insertHTML', tableHTML);
    setShowTableMenu(false);
  };

  return (
    <div className="border border-[var(--border-strong)] rounded-xl overflow-hidden bg-[var(--bg-app)] flex flex-col shadow-inner">
      <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] items-center">
        <select 
          onChange={(e) => exec('fontSize', e.target.value)} 
          className="p-1.5 border border-transparent hover:border-[var(--border-strong)] rounded-lg bg-transparent text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer"
          defaultValue="3"
          title="Font Size"
        >
          <option value="1">Smallest</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Largest</option>
        </select>
        <div className="w-px h-6 bg-[var(--border-strong)] mx-1" />
        <button type="button" onClick={() => exec('bold')} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] font-bold transition-colors" title="Bold">B</button>
        <button type="button" onClick={() => exec('italic')} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] italic font-serif transition-colors" title="Italic">I</button>
        <button type="button" onClick={() => exec('underline')} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] underline transition-colors" title="Underline">U</button>
        <div className="w-px h-6 bg-[var(--border-strong)] mx-1" />
        <button type="button" onClick={() => exec('insertOrderedList')} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] text-sm font-bold transition-colors" title="Numbered List">1.</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] text-sm font-bold transition-colors" title="Bulleted List">•</button>
        <div className="w-px h-6 bg-[var(--border-strong)] mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="px-2 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] text-xs font-bold transition-colors" title="Align Left">Left</button>
        <button type="button" onClick={() => exec('justifyCenter')} className="px-2 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] text-xs font-bold transition-colors" title="Align Center">Center</button>
        <div className="w-px h-6 bg-[var(--border-strong)] mx-1" />
        <div className="relative">
          <button type="button" onClick={() => setShowTableMenu(!showTableMenu)} className="px-2 h-8 flex items-center justify-center hover:bg-[var(--border-subtle)] rounded-lg text-[var(--text-main)] text-xs font-bold transition-colors" title="Insert Table">Table</button>
          
          <AnimatePresence>
            {showTableMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-2 left-0 bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-xl rounded-xl p-4 z-20 w-56"
              >
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-[var(--text-main)] font-bold uppercase tracking-wider">Rows</label>
                    <input type="number" min="1" max="20" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} className="w-16 p-1.5 border border-[var(--border-strong)] bg-[var(--bg-app)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-green-500 font-semibold" />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-[var(--text-main)] font-bold uppercase tracking-wider">Cols</label>
                    <input type="number" min="1" max="20" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} className="w-16 p-1.5 border border-[var(--border-strong)] bg-[var(--bg-app)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-green-500 font-semibold" />
                  </div>
                  <button type="button" onClick={insertTable} className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">Insert Table</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div 
        ref={editorRef}
        className="p-6 min-h-[300px] outline-none max-h-[600px] overflow-y-auto prose prose-sm md:prose-base prose-neutral dark:prose-invert text-[var(--text-main)] font-medium leading-relaxed"
        contentEditable
        onBlur={handleInput}
        onInput={handleInput}
        onFocus={onFocus}
        suppressContentEditableWarning
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

export default function StudentAssignments({ studentId }: { studentId: string }) {
  const [assignments, setAssignments] = useState<{mod: Module, asn: any, sub: any | null}[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  const [submitMenuOpen, setSubmitMenuOpen] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{file: File, moduleId: string, assignmentId: string} | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    
    let isMounted = true;
    let isFetching = false;
    let lastHash = '';
    
    const fetchAssignments = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        if (!isMounted) return;
        
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

        const enrolledMods: Module[] = [];
        for (const m of mods) {
          const docRef = doc(db, `modules/${m.id}/enrollments`, studentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            enrolledMods.push(m);
          }
        }

        const allAsn: {mod: Module, asn: any, sub: any | null}[] = [];
        for (const m of enrolledMods) {
          const asnSnap = await getDocs(collection(db, `modules/${m.id}/assignments`));
          for (const asnDoc of asnSnap.docs) {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            // Check for submission
            const subDocRef = doc(db, `modules/${m.id}/assignments/${asnDoc.id}/submissions`, studentId);
            const subDocSnap = await getDoc(subDocRef);
            
            allAsn.push({ 
              mod: m, 
              asn: asnData,
              sub: subDocSnap.exists() ? subDocSnap.data() : null
            });
          }
        }
        
        if (!isMounted) return;
        
        const sorted = allAsn.sort((a,b) => new Date(a.asn.deadline).getTime() - new Date(b.asn.deadline).getTime());
        const newHash = JSON.stringify(sorted);
        if (newHash !== lastHash) {
          setAssignments(sorted);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
      }
    };
    
    fetchAssignments();
    const interval = setInterval(fetchAssignments, 3000);
    const unsub = mutationEmitter.subscribe(fetchAssignments);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [studentId]);

  const handleUpload = async (moduleId: string, assignmentId: string, file: File) => {
    if (!studentId) return;
    setUploading(assignmentId);
    
    try {
      const fileRef = ref(storage, `submissions/${moduleId}_${assignmentId}_${studentId}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const subRef = doc(db, `modules/${moduleId}/assignments/${assignmentId}/submissions`, studentId);
      const subData = {
        fileUrl,
        type: 'file',
        submittedAt: Date.now()
      };
      await setDoc(subRef, subData);

      // Update local state
      setAssignments(prev => prev.map(item => {
        if (item.asn.id === assignmentId) {
          return { ...item, sub: { ...item.sub, ...subData } };
        }
        return item;
      }));
      setActiveSheet(null);
      setAnswerText('');
      
      setSelectedFile(null);
      setPreviewFileUrl(null);
    } catch(err: any) {
      console.error(err);
      alert(err.message || JSON.stringify(err) || "Failed to submit assignment.");
    } finally {
      setUploading(null);
    }
  };

  const handleOnlineSubmit = async (moduleId: string, assignmentId: string, editorContent: string) => {
    if (!studentId || !editorContent.trim()) return;
    setUploading(assignmentId);
    
    try {
      const subRef = doc(db, `modules/${moduleId}/assignments/${assignmentId}/submissions`, studentId);
      const subData = {
        content: editorContent,
        type: 'text',
        submittedAt: Date.now()
      };
      await setDoc(subRef, subData);

      // Update local state
      setAssignments(prev => prev.map(item => {
        if (item.asn.id === assignmentId) {
          return { ...item, sub: { ...item.sub, ...subData } };
        }
        return item;
      }));
      
      setActiveSheet(null);
      setAnswerText('');
    } catch(err: any) {
      console.error(err);
      alert(err.message || JSON.stringify(err) || "Failed to submit assignment.");
    } finally {
      setUploading(null);
    }
  };

  const now = new Date().getTime();
  
  const stats = {
    total: assignments.length,
    completed: assignments.filter(a => a.sub !== null).length,
    pending: assignments.filter(a => a.sub === null && new Date(a.asn.deadline).getTime() >= now).length,
    overdue: assignments.filter(a => a.sub === null && new Date(a.asn.deadline).getTime() < now).length
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
          <FileText className="w-8 h-8 mr-3 text-green-500" />
          Coursework & Assignments
        </h1>
        <p className="mt-2 text-muted font-medium max-w-2xl">
          Complete and submit tasks for your enrolled modules before the deadline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-pink-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <FileText className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.total}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Total<br/>Assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-400 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <Clock className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.pending}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Pending<br/>Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-teal-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <CheckCircle className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.completed}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Completed<br/>Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-red-500 dark:bg-[var(--bg-card)] p-6 rounded-2xl dark:border dark:border-[var(--border-subtle)] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between z-10 text-white dark:text-[var(--text-main)] h-full">
            <div className="flex items-center justify-center w-1/3">
              <AlertCircle className="w-12 h-12 text-white dark:text-muted" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center justify-center w-2/3 h-full border-l border-white/20 dark:border-[var(--border-strong)]">
              <span className="text-4xl font-bold tracking-tight text-white">{stats.overdue}</span>
              <p className="text-sm font-semibold text-white/90 dark:text-muted mt-1 uppercase tracking-wider text-center">Overdue<br/>Tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {assignments.map((item, idx) => {
            const isWriting = activeSheet === item.asn.id;
            const isSubmitted = !!item.sub;
            
            let data = { text: item.asn.description, start: item.asn.createdAt || Date.now() };
            if (typeof item.asn.description === 'string' && item.asn.description.startsWith('{')) {
              try { data = JSON.parse(item.asn.description); } catch(e) {}
            }
            const hasStarted = Date.now() >= data.start;
            const hasEnded = Date.now() > item.asn.deadline;

            if (isWriting) {
              return (
                <motion.div 
                  layout
                  key={item.asn.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full premium-card rounded-2xl border-2 border-green-500 shadow-[0_8px_30px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col min-h-[700px]"
                >
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 shadow-sm mr-4">
                          {item.mod.code}
                        </span>
                        <h3 className="text-2xl font-bold text-[var(--text-main)]">{item.asn.title}</h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Time Remaining</span>
                        <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 shadow-sm font-mono text-lg font-bold">
                          <Clock className="w-5 h-5 mr-1" />
                          <CountdownTimer targetTime={item.asn.deadline} onExpire={() => {
                            if (answerText.trim() && !uploading) {
                               alert("Time is up! Your answers are being automatically submitted.");
                               handleOnlineSubmit(item.mod.id, item.asn.id, answerText);
                            } else {
                               alert("Time is up! You are being logged out of this assignment.");
                               setActiveSheet(null);
                            }
                          }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[var(--bg-app)] border border-[var(--border-subtle)] p-6 rounded-xl mb-6 shadow-inner text-sm text-[var(--text-main)] font-medium leading-relaxed">
                      {data.text}
                      {item.asn.fileUrl && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                          <a href={item.asn.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                            <Download className="w-4 h-4 mr-1.5" /> Download Attached Resource
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0 w-full relative">
                      <span className="text-base font-bold text-[var(--text-main)] flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-muted" />
                        Online Answer Sheet
                      </span>
                      
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <button 
                            onClick={() => setSubmitMenuOpen(submitMenuOpen === item.asn.id ? null : item.asn.id)}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95 flex items-center"
                          >
                            {uploading === item.asn.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                            Submit Final Answer
                          </button>
                          
                          <AnimatePresence>
                            {submitMenuOpen === item.asn.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 bottom-full mb-3 bg-[var(--bg-card)] border border-[var(--border-strong)] shadow-xl rounded-xl p-2 z-20 w-64 flex flex-col space-y-1 transform origin-bottom-right"
                              >
                                <label className="cursor-pointer w-full text-left px-4 py-3 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)] rounded-lg flex items-center transition-colors">
                                  <Upload className="w-4 h-4 mr-3 text-blue-500" />
                                  Upload Document (PDF/Doc)
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx,.zip"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setSelectedFile({ file, moduleId: item.mod.id, assignmentId: item.asn.id });
                                        setPreviewFileUrl(URL.createObjectURL(file));
                                      }
                                      e.target.value = '';
                                      setSubmitMenuOpen(null);
                                    }} 
                                    disabled={uploading === item.asn.id}
                                  />
                                </label>
                                
                                <div className="h-px w-full bg-[var(--border-subtle)] my-1" />

                                <button 
                                  onClick={() => {
                                    handleOnlineSubmit(item.mod.id, item.asn.id, answerText);
                                    setSubmitMenuOpen(null);
                                  }}
                                  disabled={uploading === item.asn.id || !answerText.trim()}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)] rounded-lg disabled:opacity-50 flex items-center transition-colors"
                                >
                                  <Edit3 className="w-4 h-4 mr-3 text-green-500" />
                                  Submit Written Text
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => {setActiveSheet(null); setAnswerText(''); setSubmitMenuOpen(null);}} 
                          className="px-4 py-2.5 border border-[var(--border-strong)] bg-[var(--bg-card)] text-muted hover:text-[var(--text-main)] rounded-xl font-bold text-sm transition-colors shadow-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col mt-2">
                      <RichTextEditor 
                        value={answerText}
                        onChange={setAnswerText}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div 
                layout
                key={item.asn.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "premium-card rounded-2xl flex flex-col border-2 transition-all group overflow-hidden",
                  isSubmitted 
                    ? "border-transparent opacity-80" 
                    : hasEnded 
                      ? "border-transparent opacity-70 grayscale-[50%]"
                      : "border-transparent hover:border-green-500/30 hover:shadow-md"
                )}
              >
                <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className={clsx(
                      "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm",
                      isSubmitted 
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
                        : "bg-[var(--bg-app)] text-muted border-[var(--border-strong)]"
                    )}>
                      {item.mod.code}
                    </span>
                    <span className="text-sm font-bold text-muted bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border-subtle)] shadow-inner">
                      {item.asn.marks} Pts
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-3 leading-tight">
                    {item.asn.title}
                  </h3>
                  
                  <div className="mt-auto space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                    {!isSubmitted && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-sm font-bold text-[var(--text-main)]">
                          <span className="text-muted flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5" /> Start
                          </span>
                          {new Date(data.start).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold text-[var(--text-main)]">
                          <span className="text-red-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" /> Deadline
                          </span>
                          <span className={clsx(hasEnded && "text-red-500")}>
                            {new Date(item.asn.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {isSubmitted && item.sub && (
                      <div className="bg-green-50/50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 p-4 rounded-xl shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                          </span>
                          <span className="text-xs font-bold text-muted">
                            {new Date(item.sub.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.sub.grade !== undefined && item.sub.grade !== null ? (
                          <>
                            <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{item.sub.grade} <span className="text-sm text-muted font-medium">/ {item.asn.marks}</span></p>
                            {item.sub.feedback && (
                              <p className="text-sm font-medium text-muted mt-2 pt-2 border-t border-green-200 dark:border-green-500/20 italic">
                                "{item.sub.feedback}"
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center mt-2">
                            <Clock className="w-4 h-4 mr-1.5" /> Pending Grade
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-500/20 flex justify-end">
                           {item.sub.type === 'text' ? (
                             <button onClick={() => setViewingSubmission(item.sub.content)} className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline">Read Answer</button>
                           ) : (
                             <a href={item.sub.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline">View Upload</a>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {!isSubmitted && (
                  <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
                    {!hasStarted ? (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-[var(--bg-card)] border border-[var(--border-strong)] text-muted rounded-xl text-sm font-bold flex justify-center items-center cursor-not-allowed shadow-inner"
                      >
                        <Clock className="w-4 h-4 mr-2" /> Opens: <span className="ml-1"><CountdownTimer targetTime={data.start} /></span>
                      </button>
                    ) : hasEnded ? (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-500 rounded-xl text-sm font-bold flex justify-center items-center cursor-not-allowed opacity-70"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" /> Deadline Passed
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setActiveSheet(item.asn.id); setAnswerText(''); setSubmitMenuOpen(null); }}
                        className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95 flex justify-center items-center group/btn"
                      >
                        <Edit3 className="w-4 h-4 mr-2 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                        Start Assignment
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {assignments.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-subtle)]">
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-[var(--text-main)] font-semibold text-lg">You're all caught up!</p>
            <p className="text-sm text-muted mt-1 text-center max-w-md">There are no pending assignments across your enrolled modules.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingSubmission && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setViewingSubmission(null)}
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
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center mr-3 font-bold text-lg">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-main)] text-lg leading-tight">Your Submitted Answer</h3>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Online Submission</p>
                  </div>
                </div>
                <button onClick={() => setViewingSubmission(null)} className="p-2 text-muted hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div 
                className="p-6 md:p-8 overflow-y-auto w-full prose prose-sm md:prose-base prose-neutral dark:prose-invert text-[var(--text-main)] font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: viewingSubmission }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFile && previewFileUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => { setSelectedFile(null); setPreviewFileUrl(null); }}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-[var(--border-strong)]"
            >
              <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-app)] shrink-0">
                <h3 className="font-bold text-[var(--text-main)] flex items-center text-lg">
                  <Upload className="w-5 h-5 mr-3 text-blue-500" />
                  Confirm Document Submission
                </h3>
                <button 
                  onClick={() => { setSelectedFile(null); setPreviewFileUrl(null); }} 
                  className="p-2 text-muted hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-[#f8f9fa] dark:bg-neutral-950 p-6 flex flex-col items-center justify-center relative shadow-inner">
                {selectedFile.file.type.startsWith('image/') ? (
                  <img src={previewFileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-[var(--border-strong)]" />
                ) : selectedFile.file.type === 'application/pdf' ? (
                  <iframe src={previewFileUrl} className="w-full h-full border border-[var(--border-strong)] bg-white rounded-lg shadow-lg" title="PDF Preview" />
                ) : (
                  <div className="text-center p-8 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-strong)] shadow-xl max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="text-[var(--text-main)] font-bold text-lg mb-1 truncate px-4">{selectedFile.file.name}</p>
                    <p className="text-muted font-bold text-sm uppercase tracking-wider mb-8">{(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start text-left">
                      <AlertCircle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-500 leading-snug">Preview not available for this file format. Ensure you have selected the correct document before submitting.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-end space-x-3 shrink-0">
                <button 
                  onClick={() => { setSelectedFile(null); setPreviewFileUrl(null); }} 
                  disabled={uploading === selectedFile.assignmentId}
                  className="px-6 py-2.5 border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-main)] rounded-xl shadow-sm hover:bg-[var(--border-subtle)] disabled:opacity-50 transition-colors font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpload(selectedFile.moduleId, selectedFile.assignmentId, selectedFile.file)} 
                  disabled={uploading === selectedFile.assignmentId}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl shadow-sm hover:bg-green-700 font-bold flex items-center disabled:opacity-50 transition-all active:scale-95 text-sm"
                >
                  {uploading === selectedFile.assignmentId ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                  Submit Assignment File
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
