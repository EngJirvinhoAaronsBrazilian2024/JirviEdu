import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, getDocs, doc, getDoc, mutationEmitter } from '../../lib/db';
import { Award, FileText, CheckCircle, Printer, Trophy } from 'lucide-react';
import { Module, Student } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export default function StudentResults({ student }: { student: Student | null }) {
  const [results, setResults] = useState<{mod: Module, asn: any, sub: any}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) return;
    
    let isMounted = true;
    let isFetching = false;
    let lastHash = '';
    
    const fetchResults = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        if (!isMounted) return;
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

        const gradedSubmissions: {mod: Module, asn: any, sub: any}[] = [];
        
        for (const m of mods) {
          const asnSnap = await getDocs(collection(db, `modules/${m.id}/assignments`));
          for (const asnDoc of asnSnap.docs) {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            // Check for submission
            const subDocRef = doc(db, `modules/${m.id}/assignments/${asnDoc.id}/submissions`, student.id);
            const subDocSnap = await getDoc(subDocRef);
            
            if (subDocSnap.exists()) {
              const subData = subDocSnap.data() as any;
              if (subData.grade !== undefined && subData.grade !== null) {
                 gradedSubmissions.push({ 
                  mod: m, 
                  asn: asnData,
                  sub: subData
                });
              }
            }
          }
        }
        if (!isMounted) return;
        
        const sorted = gradedSubmissions.sort((a,b) => b.sub.submittedAt - a.sub.submittedAt);
        const newHash = JSON.stringify(sorted);
        if (newHash !== lastHash) {
          setResults(sorted);
          lastHash = newHash;
        }
      } catch (err) {
        console.error(err);
      } finally {
        isFetching = false;
        if (isMounted) setLoading(false);
      }
    };
    
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    const unsub = mutationEmitter.subscribe(fetchResults);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [student?.id]);

  const handlePrint = async () => {
    if (!student) return;
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
    
      // Try to load user logo
      try {
        const response = await fetch('/icon.png');
        const blob = await response.blob();
        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(base64data, 'PNG', 14, 15, 20, 20);
      } catch (e) {
        console.warn("Could not load icon", e);
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text('ACADEMIC PORTAL STUDY INITIATIVE', 40, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text('Student Official Result Slip', 40, 33);
      
      // Details
      doc.setFontSize(11);
      doc.text(`Student Name: ${student.fullName || 'N/A'}`, 14, 50);
      doc.text(`Registration No: ${student.regNumber || 'N/A'}`, 14, 56);
      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 14, 62);
      
      doc.text(`Course: ${student.course || 'N/A'}`, 120, 50);
      const totalE = results.reduce((acc, curr) => acc + (Number(curr.sub.grade) || 0), 0);
      const totalP = results.reduce((acc, curr) => acc + (Number(curr.asn.marks) || 0), 0);
      const oP = totalP > 0 ? ((totalE / totalP) * 100).toFixed(1) : '0.0';
      doc.text(`Overall Average: ${oP}%`, 120, 56);
      doc.text(`Total Assignments Graded: ${results.length}`, 120, 62);

      const tableBody = results.map(item => [
        `${item.asn.title}\n${item.mod.code} - ${item.mod.name}`,
        new Date(item.sub.submittedAt).toLocaleDateString(),
        `${item.sub.grade} / ${item.asn.marks}`,
        item.sub.feedback || 'No feedback provided'
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Module & Assignment', 'Submitted On', 'Grade', 'Feedback']],
        body: tableBody,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [40, 40, 40] }
      });

      doc.save(`${student.regNumber || 'Student'}_Results.pdf`);
    } catch (err) { console.error('PDF generation failed', err); alert('Failed to generate PDF') }
  };

  // Calculate generic GPA or total percentage based on what we have
  const totalEarned = results.reduce((acc, curr) => acc + (Number(curr.sub.grade) || 0), 0);
  const totalPossible = results.reduce((acc, curr) => acc + (Number(curr.asn.marks) || 0), 0);
  const overallPercentage = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:m-0 print:p-0 print:max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
            <Trophy className="w-8 h-8 mr-3 text-amber-500" />
            Academic Results
          </h1>
          <p className="mt-2 text-muted font-medium print:hidden">View your graded assignments, feedback, and overall performance.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="print:hidden flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95 font-bold text-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Download Transcript
        </button>
      </div>

      <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden border-2 border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 shadow-sm"
        >
          <div className="flex items-center justify-between z-10">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl shadow-sm border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-4xl font-bold text-[var(--text-main)] tracking-tight">{overallPercentage}%</span>
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider z-10">Overall Grade Average</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-6 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden border-2 border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-sm"
        >
          <div className="flex items-center justify-between z-10">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-4xl font-bold text-[var(--text-main)] tracking-tight">{results.length}</span>
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider z-10">Graded Assignments</p>
        </motion.div>
      </div>

      {/* Print summary visible only in print mode */}
      <div className="hidden print:block mb-8 pb-4 border-b print:border-black flex flex-col items-center text-center">
        <div className="flex flex-col items-center justify-center gap-3 mb-4">
           <h1 className="text-2xl font-bold print:text-black uppercase tracking-widest text-center">ACADEMIC PORTAL STUDY INITIATIVE</h1>
        </div>
        <h2 className="text-xl font-bold print:text-black mb-4 whitespace-nowrap">Student Official Result Slip</h2>
        <div className="flex justify-between w-full text-sm print:text-black mt-4 text-left px-2">
          <div>
            <p className="mb-1"><strong>Student Name:</strong> {student?.fullName || 'N/A'}</p>
            <p className="mb-1"><strong>Registration No:</strong> {student?.regNumber || 'N/A'}</p>
            <p><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="mb-1"><strong>Course:</strong> {student?.course || 'N/A'}</p>
            <p className="mb-1"><strong>Overall Average:</strong> {overallPercentage}%</p>
            <p><strong>Total Assignments Graded:</strong> {results.length}</p>
          </div>
        </div>
      </div>

      <div className="premium-card print:bg-white rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--text-main)] font-semibold">Loading your results...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-subtle)] print:divide-black">
                <thead className="bg-[var(--bg-app)] print:bg-white border-b border-[var(--border-strong)] print:border-black">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted print:text-black uppercase tracking-wider">Module & Assignment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted print:text-black uppercase tracking-wider">Submitted On</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted print:text-black uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted print:text-black uppercase tracking-wider">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] print:divide-black bg-[var(--bg-card)] print:bg-white">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-app)] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 shadow-sm border border-blue-200 dark:border-blue-500/20 shrink-0 print:hidden">
                            <FileText className="w-5 h-5"/>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--text-main)] print:text-black mb-1">{item.asn.title}</div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-app)] border border-[var(--border-strong)] text-muted print:border-none print:p-0">
                              {item.mod.code} - {item.mod.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-muted print:text-black font-semibold">
                        {new Date(item.sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-baseline">
                          <span className="text-xl font-bold text-[var(--text-main)] print:text-black">{item.sub.grade}</span>
                          <span className="text-sm text-muted print:text-black ml-1.5 font-bold">/ {item.asn.marks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {item.sub.feedback ? (
                          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)] print:border-none print:p-0 print:bg-transparent">
                            <p className="text-sm text-[var(--text-main)] print:text-black line-clamp-2 print:line-clamp-none italic font-medium" title={item.sub.feedback}>
                              "{item.sub.feedback}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted print:text-black italic font-semibold">No feedback provided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-subtle)]">
                          <Award className="w-8 h-8 text-muted opacity-50 print:text-black" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-main)] print:text-black">No Grades Yet</h3>
                        <p className="text-sm text-muted print:text-black mt-1 max-w-sm mx-auto">Your graded assignments will appear here once marked by your instructors.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden print:hidden flex flex-col divide-y divide-[var(--border-subtle)]">
              {results.map((item, idx) => (
                <div key={idx} className="p-5 flex flex-col space-y-4 bg-[var(--bg-card)]">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 shadow-sm border border-blue-200 dark:border-blue-500/20 shrink-0">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-main)]">{item.asn.title}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-app)] border border-[var(--border-strong)] text-muted mt-1">
                          {item.mod.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end whitespace-nowrap ml-4">
                      <div className="flex items-baseline">
                        <span className="text-xl font-bold text-[var(--text-main)]">{item.sub.grade}</span>
                        <span className="text-xs text-muted font-bold ml-1">/ {item.asn.marks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-y border-[var(--border-subtle)]">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Submitted On</span>
                    <span className="text-sm text-[var(--text-main)] font-semibold">
                      {new Date(item.sub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Instructor Feedback</span>
                     {item.sub.feedback ? (
                        <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-inner">
                          <p className="text-sm text-[var(--text-main)] italic font-medium">
                            "{item.sub.feedback}"
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted italic font-semibold">No feedback provided</span>
                      )}
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-subtle)]">
                    <Award className="w-8 h-8 text-muted opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">No Grades Yet</h3>
                  <p className="text-sm text-muted mt-1">Your graded assignments will appear here once marked by an administrator.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
