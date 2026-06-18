import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, doc, setDoc, getDoc, storage, ref, uploadBytes, getDownloadURL, mutationEmitter } from '../../lib/db';
import { FileText, Clock, Upload, CheckCircle, Loader2, Edit3, X, Send } from 'lucide-react';
import clsx from 'clsx';
import { Module } from '../../types';

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
        rowsHtml += '<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>';
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
    <div className="border border-neutral-600 rounded-lg overflow-hidden bg-neutral-800 flex flex-col">
      <div className="flex flex-wrap gap-1 p-2 border-b border-neutral-600 bg-neutral-900 shadow-sm items-center">
        <select 
          onChange={(e) => exec('fontSize', e.target.value)} 
          className="p-1 border border-neutral-600 rounded bg-neutral-800 text-sm focus:outline-none"
          defaultValue="3"
          title="Font Size"
        >
          <option value="1">Smallest</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Largest</option>
        </select>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-200 font-bold" title="Bold">B</button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-200 italic font-serif" title="Italic">I</button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-200 underline" title="Underline">U</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-200 text-sm font-medium" title="Numbered List">1.</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-200 text-sm font-medium" title="Bulleted List">•</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-200 text-sm font-medium" title="Align Left">Left</button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-200 text-sm font-medium" title="Align Center">Center</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <div className="relative">
          <button type="button" onClick={() => setShowTableMenu(!showTableMenu)} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-200 text-sm font-medium" title="Insert Table">Table</button>
          
          {showTableMenu && (
            <div className="absolute top-full mt-1 left-0 bg-neutral-800 border border-neutral-700 shadow-lg rounded-md p-3 z-10 w-48">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-neutral-300 font-medium">Rows</label>
                  <input type="number" min="1" max="20" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} className="w-16 p-1 border border-neutral-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-neutral-300 font-medium">Cols</label>
                  <input type="number" min="1" max="20" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} className="w-16 p-1 border border-neutral-600 rounded text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <button type="button" onClick={insertTable} className="w-full mt-2 py-1.5 bg-neutral-900 text-neutral-50 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors">Insert</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div 
        ref={editorRef}
        className="p-4 min-h-[250px] outline-none max-h-[500px] overflow-y-auto prose text-sm"
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
      
      alert("Assignment submitted successfully!");
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
      alert("Online assignment submitted successfully!");
    } catch(err: any) {
      console.error(err);
      alert(err.message || JSON.stringify(err) || "Failed to submit assignment.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-50">Assignments</h1>
        <p className="mt-1 text-sm text-neutral-400">View and submit coursework tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((item, idx) => {
          const isWriting = activeSheet === item.asn.id;
          const isSubmitted = !!item.sub;
          
          let data = { text: item.asn.description, start: item.asn.createdAt || Date.now() };
          if (typeof item.asn.description === 'string' && item.asn.description.startsWith('{')) {
            try { data = JSON.parse(item.asn.description); } catch(e) {}
          }
          const hasStarted = Date.now() >= data.start;
          const hasEnded = Date.now() > item.asn.deadline;

          if (!isWriting && !isSubmitted) {
            return (
              <div key={idx} className="card-emerald bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-50 mb-4">{item.asn.title}</h3>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-neutral-300"><span className="font-semibold text-neutral-50">Module:</span> {item.mod.code}</p>
                    <p className="text-sm text-neutral-300"><span className="font-semibold text-neutral-50">Start Time:</span> {new Date(data.start).toLocaleString()}</p>
                    <p className="text-sm text-neutral-300"><span className="font-semibold text-neutral-50">End Time (Deadline):</span> {new Date(item.asn.deadline).toLocaleString()}</p>
                  </div>
                </div>
                {!hasStarted ? (
                  <button 
                    disabled
                    className="w-full py-2 bg-neutral-700 text-neutral-300 rounded-md text-sm font-medium flex justify-center items-center opacity-70 cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4 mr-2" /> Starts in: <span className="ml-1 font-mono font-bold"><CountdownTimer targetTime={data.start} /></span>
                  </button>
                ) : hasEnded ? (
                  <button 
                    disabled
                    className="w-full py-2 bg-neutral-700 text-red-400 rounded-md text-sm font-medium flex justify-center items-center opacity-70 cursor-not-allowed"
                  >
                    Deadline Passed
                  </button>
                ) : (
                  <button 
                    onClick={() => { setActiveSheet(item.asn.id); setAnswerText(''); setSubmitMenuOpen(null); }}
                    className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition flex justify-center items-center"
                  >
                    Start Assignment
                  </button>
                )}
              </div>
            );
          }

          return (
            <div key={idx} className={clsx("card-emerald bg-neutral-800 rounded-xl border border-neutral-700 shadow-sm overflow-hidden flex flex-col", isWriting && "md:col-span-2")}>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.mod.code}
                  </span>
                  <span className="text-sm font-bold text-neutral-50">{item.asn.marks} Marks</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-50 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  {item.asn.title}
                </h3>
                <p className="text-sm text-neutral-300 line-clamp-3 mb-4">{data.text}</p>
                {item.asn.fileUrl && (
                  <a href={item.asn.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 font-medium block mb-4">Download Assignment</a>
                )}
                
                {item.sub && item.sub.grade !== undefined && item.sub.grade !== null && (
                  <div className="mt-4 p-3 bg-neutral-800 border border-green-500/30 rounded-lg mb-4">
                    <p className="text-sm font-bold text-green-400">Grade: {item.sub.grade} / {item.asn.marks}</p>
                    {item.sub.feedback && <p className="text-xs text-green-300 mt-1">Feedback: {item.sub.feedback}</p>}
                  </div>
                )}
                
                {isWriting && (
                  <div className="mt-6 border-t border-neutral-700 pt-6 flex flex-col flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0 w-full relative">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-bold text-neutral-200">Online Answer Sheet</span>
                        <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20 shadow-sm" title="Time Remaining">
                          <Clock className="w-4 h-4 ml-1" />
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
                      
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button 
                            onClick={() => setSubmitMenuOpen(submitMenuOpen === item.asn.id ? null : item.asn.id)}
                            className="px-4 py-2 bg-neutral-900 text-neutral-50 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center shadow-sm"
                          >
                            {uploading === item.asn.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                            Submit AnswerSheet
                          </button>
                          
                          {submitMenuOpen === item.asn.id && (
                            <div className="absolute right-0 top-full mt-2 bg-neutral-800 border border-neutral-700 shadow-xl rounded-md p-2 z-20 w-56 flex flex-col space-y-1">
                              <label className="cursor-pointer w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 rounded flex items-center">
                                <Upload className="w-4 h-4 mr-2 text-neutral-400" />
                                Upload AnswerSheet
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
                              
                              <button 
                                onClick={() => {
                                  handleOnlineSubmit(item.mod.id, item.asn.id, answerText);
                                  setSubmitMenuOpen(null);
                                }}
                                disabled={uploading === item.asn.id || !answerText.trim()}
                                className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 rounded disabled:opacity-50 flex items-center"
                              >
                                <Edit3 className="w-4 h-4 mr-2 text-neutral-400" />
                                Submit Online Answers
                              </button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => {setActiveSheet(null); setAnswerText(''); setSubmitMenuOpen(null);}} className="p-2 border border-neutral-600 rounded-md text-neutral-400 hover:text-neutral-200 bg-neutral-800 shadow-sm flex items-center justify-center h-[38px] w-[38px]" title="Close Editor">
                            <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-800 rounded-lg flex-1">
                      <RichTextEditor 
                        value={answerText}
                        onChange={setAnswerText}
                      />
                    </div>
                  </div>
                )}
                
              </div>
              
              {!isWriting && item.sub && (
                 <div className="px-6 py-4 bg-neutral-900 border-t border-neutral-100 flex items-center justify-between">
                   <div className="flex items-center text-green-600 text-sm font-medium">
                     <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                   </div>
                 </div>
              )}
            </div>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full bg-neutral-800 p-8 rounded-xl border border-neutral-700 text-center text-neutral-400">
            No assignments due.
          </div>
        )}
      </div>

      {viewingSubmission && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
              <h3 className="font-bold text-neutral-50">Your Submitted Answer</h3>
              <button onClick={() => setViewingSubmission(null)} className="text-neutral-400 hover:text-neutral-200">
                Close
              </button>
            </div>
            <div 
              className="p-6 overflow-y-auto w-full prose text-sm text-neutral-200 font-medium prose-invert"
              dangerouslySetInnerHTML={{ __html: viewingSubmission }}
            />
          </div>
        </div>
      )}

      {selectedFile && previewFileUrl && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-neutral-700">
            <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="font-bold text-neutral-50 flex items-center text-lg">
                <FileText className="w-5 h-5 mr-3 text-blue-400" />
                Upload Preview
              </h3>
              <button 
                onClick={() => { setSelectedFile(null); setPreviewFileUrl(null); }} 
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-neutral-950 p-6 flex flex-col items-center justify-center relative">
              {selectedFile.file.type.startsWith('image/') ? (
                <img src={previewFileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow" />
              ) : selectedFile.file.type === 'application/pdf' ? (
                <iframe src={previewFileUrl} className="w-full h-full border-0 bg-white rounded shadow" title="PDF Preview" />
              ) : (
                <div className="text-center p-8 bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm max-w-md w-full">
                  <FileText className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
                  <p className="text-neutral-300 font-medium text-lg mb-2">{selectedFile.file.name}</p>
                  <p className="text-neutral-500 mb-6 font-mono">{(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-sm text-neutral-400 px-4 py-2 bg-neutral-800 rounded-md">Preview not available for this file type.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-neutral-700 bg-neutral-900 flex justify-end space-x-3 shrink-0">
              <button 
                onClick={() => { setSelectedFile(null); setPreviewFileUrl(null); }} 
                disabled={uploading === selectedFile.assignmentId}
                className="px-6 py-2.5 bg-neutral-800 text-neutral-50 rounded shadow-sm hover:bg-neutral-700 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpload(selectedFile.moduleId, selectedFile.assignmentId, selectedFile.file)} 
                disabled={uploading === selectedFile.assignmentId}
                className="px-6 py-2.5 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 font-bold flex items-center disabled:opacity-50 transition-colors"
              >
                {uploading === selectedFile.assignmentId ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2" />}
                Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
