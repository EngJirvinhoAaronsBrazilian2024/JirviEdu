import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { Award, FileText, CheckCircle, Printer } from 'lucide-react';
import { Module } from '../../types';

export default function StudentResults({ studentId }: { studentId: string }) {
  const [results, setResults] = useState<{mod: Module, asn: any, sub: any}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchResults = async () => {
      try {
        const q = query(collection(db, 'modules'));
        const snap = await getDocs(q);
        const mods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Module));

        const gradedSubmissions: {mod: Module, asn: any, sub: any}[] = [];
        
        for (const m of mods) {
          const asnSnap = await getDocs(collection(db, `modules/${m.id}/assignments`));
          for (const asnDoc of asnSnap.docs) {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            // Check for submission
            const subDocRef = doc(db, `modules/${m.id}/assignments/${asnDoc.id}/submissions`, studentId);
            const subDocSnap = await getDoc(subDocRef);
            
            if (subDocSnap.exists()) {
              const subData = subDocSnap.data();
              if (subData.grade !== undefined) {
                 gradedSubmissions.push({ 
                  mod: m, 
                  asn: asnData,
                  sub: subData
                });
              }
            }
          }
        }
        setResults(gradedSubmissions.sort((a,b) => b.sub.submittedAt - a.sub.submittedAt));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [studentId]);

  const handlePrint = () => {
    if (window.self !== window.top) {
      alert("Please open the application in a new tab (using the button in the top right) to download or print your result slip. The preview environment blocks print dialogs.");
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500">Loading your results...</div>
      </div>
    );
  }

  // Calculate generic GPA or total percentage based on what we have
  const totalEarned = results.reduce((acc, curr) => acc + (Number(curr.sub.grade) || 0), 0);
  const totalPossible = results.reduce((acc, curr) => acc + (Number(curr.asn.marks) || 0), 0);
  const overallPercentage = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:m-0 print:p-0 print:max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Results</h1>
          <p className="mt-1 text-sm text-slate-500 print:hidden">View your graded assignments and overall performance.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="print:hidden flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Download Slip
        </button>
      </div>

      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 bg-indigo-500/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between z-10">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-indigo-50 flex items-center justify-center">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-4xl font-bold text-slate-900 tracking-tight">{overallPercentage}%</span>
          </div>
          <p className="text-sm font-semibold text-indigo-600/80 z-10">Overall Grade Average</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between z-10">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{results.length}</span>
          </div>
          <p className="text-sm font-semibold text-emerald-600/80 z-10">Graded Assignments</p>
        </div>
      </div>

      {/* Print summary visible only in print mode */}
      <div className="hidden print:block mb-8 pb-4 border-b border-neutral-300">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Student Official Result Slip</h2>
        <div className="flex justify-between text-sm text-slate-700">
          <div>
            <p><strong>Student ID:</strong> {studentId}</p>
            <p><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p><strong>Overall Average:</strong> {overallPercentage}%</p>
            <p><strong>Total Assignments Graded:</strong> {results.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Module & Assignment</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted On</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white">
            {results.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-indigo-500 mr-3 hidden sm:block" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">{item.asn.title}</div>
                      <div className="text-xs font-medium text-slate-500">{item.mod.code} - {item.mod.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                  {new Date(item.sub.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-baseline">
                    <span className="text-lg font-bold text-slate-900">{item.sub.grade}</span>
                    <span className="text-sm text-slate-500 ml-1">/ {item.asn.marks}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.sub.feedback ? (
                    <p className="text-sm text-slate-600 line-clamp-2" title={item.sub.feedback}>
                      {item.sub.feedback}
                    </p>
                  ) : (
                    <span className="text-sm text-slate-400 italic">No feedback provided</span>
                  )}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-slate-900">No Grades Yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Your graded assignments will appear here once marked by an administrator.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
