import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { FileText, Clock, Upload, CheckCircle, Loader2, Edit3, X, Send } from 'lucide-react';
import { Module } from '../../types';

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
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="flex flex-wrap gap-1 p-2 border-b border-neutral-300 bg-neutral-50 shadow-sm items-center">
        <select 
          onChange={(e) => exec('fontSize', e.target.value)} 
          className="p-1 border border-neutral-300 rounded bg-white text-sm focus:outline-none"
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
        <button type="button" onClick={() => exec('bold')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 font-bold" title="Bold">B</button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 italic font-serif" title="Italic">I</button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 underline" title="Underline">U</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-700 text-sm font-medium" title="Numbered List">1.</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-700 text-sm font-medium" title="Bulleted List">•</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-700 text-sm font-medium" title="Align Left">Left</button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-700 text-sm font-medium" title="Align Center">Center</button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <div className="relative">
          <button type="button" onClick={() => setShowTableMenu(!showTableMenu)} className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-700 text-sm font-medium" title="Insert Table">Table</button>
          
          {showTableMenu && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-neutral-200 shadow-lg rounded-md p-3 z-10 w-48">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-neutral-600 font-medium">Rows</label>
                  <input type="number" min="1" max="20" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} className="w-16 p-1 border border-neutral-300 rounded text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-neutral-600 font-medium">Cols</label>
                  <input type="number" min="1" max="20" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} className="w-16 p-1 border border-neutral-300 rounded text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <button type="button" onClick={insertTable} className="w-full mt-2 py-1.5 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors">Insert</button>
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

  useEffect(() => {
    if (!studentId) return;
    const fetchAssignments = async () => {
      const q = query(collection(db, 'modules'));
      const snap = await getDocs(q);
      const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

      const allAsn: {mod: Module, asn: any, sub: any | null}[] = [];
      for (const m of mods) {
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
      setAssignments(allAsn.sort((a,b) => a.asn.deadline - b.asn.deadline));
    };
    fetchAssignments();
  }, [studentId]);

  const handleUpload = async (moduleId: string, assignmentId: string, file: File) => {
    if (!studentId) return;
    setUploading(assignmentId);
    
    try {
      if (file.size > 800 * 1024) {
        throw new Error("File is too large. Please select a file smaller than 800KB.");
      }
      
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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
    } catch(err: any) {
      console.error(err);
      alert(err.message || "Failed to submit assignment.");
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
      alert(err.message || "Failed to submit assignment.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Assignments</h1>
        <p className="mt-1 text-sm text-neutral-500">View and submit coursework tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((item, idx) => {
          const isOverdue = item.asn.deadline < Date.now() && !item.sub;
          const isWriting = activeSheet === item.asn.id;
          const isSubmitted = !!item.sub;

          if (!isWriting && !isSubmitted) {
            return (
              <div key={idx} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">{item.asn.title}</h3>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-neutral-600"><span className="font-semibold text-neutral-900">Name:</span> {item.mod.code}</p>
                    <p className="text-sm text-neutral-600"><span className="font-semibold text-neutral-900">Date:</span> {new Date(item.asn.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-neutral-600"><span className="font-semibold text-neutral-900">Start Time:</span> {new Date(item.asn.createdAt).toLocaleTimeString()}</p>
                    <p className="text-sm text-neutral-600"><span className="font-semibold text-neutral-900">End Time:</span> {new Date(item.asn.deadline).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveSheet(item.asn.id); setAnswerText(''); setSubmitMenuOpen(null); }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition flex justify-center items-center"
                >
                  Start Assignment
                </button>
              </div>
            );
          }

          return (
            <div key={idx} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.mod.code}
                  </span>
                  <span className="text-sm font-bold text-neutral-900">{item.asn.marks} Marks</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  {item.asn.title}
                </h3>
                <p className="text-sm text-neutral-600 line-clamp-3 mb-4">{item.asn.description}</p>
                {item.asn.fileUrl && (
                  <a href={item.asn.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium block mb-4">Download Assignment</a>
                )}
                
                {item.sub && item.sub.grade !== undefined && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg mb-4">
                    <p className="text-sm font-bold text-indigo-900">Grade: {item.sub.grade} / {item.asn.marks}</p>
                    {item.sub.feedback && <p className="text-xs text-indigo-700 mt-1">Feedback: {item.sub.feedback}</p>}
                  </div>
                )}
                
                {isWriting && (
                  <div className="mt-6 border-t border-neutral-200 pt-6 flex flex-col flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0 w-full relative">
                      <span className="text-sm font-bold text-neutral-700">Online Answer Sheet</span>
                      
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button 
                            onClick={() => setSubmitMenuOpen(submitMenuOpen === item.asn.id ? null : item.asn.id)}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center shadow-sm"
                          >
                            {uploading === item.asn.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                            Submit AnswerSheet
                          </button>
                          
                          {submitMenuOpen === item.asn.id && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 shadow-xl rounded-md p-2 z-20 w-56 flex flex-col space-y-1">
                              <label className="cursor-pointer w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded flex items-center">
                                <Upload className="w-4 h-4 mr-2 text-neutral-500" />
                                Upload AnswerSheet
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,.doc,.docx,.zip"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(item.mod.id, item.asn.id, file);
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
                                className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded disabled:opacity-50 flex items-center"
                              >
                                <Edit3 className="w-4 h-4 mr-2 text-neutral-500" />
                                Submit Online Answers
                              </button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => {setActiveSheet(null); setAnswerText(''); setSubmitMenuOpen(null);}} className="p-2 border border-neutral-300 rounded-md text-neutral-500 hover:text-neutral-700 bg-white shadow-sm flex items-center justify-center h-[38px] w-[38px]" title="Close Editor">
                            <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg flex-1">
                      <RichTextEditor 
                        value={answerText}
                        onChange={setAnswerText}
                      />
                    </div>
                  </div>
                )}
                
              </div>
              
              {!isWriting && item.sub && (
                 <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                   <div className="flex items-center text-green-600 text-sm font-medium">
                     <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                     {item.sub.type === 'text' ? (
                       <button onClick={() => setViewingSubmission(item.sub.content)} className="ml-2 text-indigo-600 hover:underline">View</button>
                     ) : (
                       <a href={item.sub.fileUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline">View</a>
                     )}
                   </div>
                 </div>
              )}
            </div>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-neutral-200 text-center text-neutral-500">
            No assignments due.
          </div>
        )}
      </div>

      {viewingSubmission && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="font-bold text-neutral-900">Your Submitted Answer</h3>
              <button onClick={() => setViewingSubmission(null)} className="text-neutral-500 hover:text-neutral-700">
                Close
              </button>
            </div>
            <div 
              className="p-6 overflow-y-auto w-full prose text-sm text-neutral-800 font-medium"
              dangerouslySetInnerHTML={{ __html: viewingSubmission }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
