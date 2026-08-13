import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { collection, query, getDocs, doc, getDoc, mutationEmitter } from '../../lib/db';
import { Award, FileText, CheckCircle, Printer, Trophy } from 'lucide-react';
import { Module, Student } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import StudentResultSlip from './StudentResultSlip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function StudentResults({ student }: { student: Student | null }) {
  const [results, setResults] = useState<{mod: Module, asn: any, sub: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlip, setShowSlip] = useState(false);

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

        const gradedSubmissions = (await Promise.all(mods.map(async m => {
          const asnSnap = await getDocs(collection(db, `modules/${m.id}/assignments`));
          const subs = await Promise.all(asnSnap.docs.map(async asnDoc => {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            const subDocSnap = await getDoc(doc(db, `modules/${m.id}/assignments/${asnDoc.id}/submissions`, student.id));
            if (subDocSnap.exists()) {
              const subData = subDocSnap.data() as any;
              if (subData.grade !== undefined && subData.grade !== null) {
                return { mod: m, asn: asnData, sub: subData };
              }
            }
            return null;
          }));
          return subs.filter(Boolean);
        }))).flat();
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
    const unsub = mutationEmitter.subscribe(fetchResults);
    return () => {
      isMounted = false;
      unsub();
    };
  }, [student?.id]);

  const handlePrint = () => {
    setShowSlip(true);
  };

  // Calculate generic GPA or total percentage based on what we have
  const totalEarned = results.reduce((acc, curr) => acc + (Number(curr.sub.grade) || 0), 0);
  const totalPossible = results.reduce((acc, curr) => acc + (Number(curr.asn.marks) || 0), 0);
  const overallPercentage = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:m-0 print:p-0 print:max-w-none">
      <AnimatePresence>
        {showSlip && student && (
          <StudentResultSlip 
            student={student} 
            results={results} 
            onClose={() => setShowSlip(false)} 
          />
        )}
      </AnimatePresence>

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
          View Official Result Slip
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Award className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Graded Tasks</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{results.length}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
            <CheckCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Marks Earned</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{totalEarned}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <FileText className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Possible</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{totalPossible}</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="p-3 rounded-xl shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Trophy className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Overall Score</p>
            <span className="text-2xl font-bold text-[var(--text-main)] mt-0.5">{overallPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="print:hidden premium-card p-6 rounded-2xl shadow-sm mb-6">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2 text-blue-500" />
          Performance History
        </h3>
        <div className="h-72 w-full">
          {results.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...results].reverse().map(r => ({
                  name: r.asn.title,
                  module: r.mod.code,
                  percentage: Math.round((Number(r.sub.grade) / Number(r.asn.marks)) * 100) || 0
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-hover)' }}
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
              <FileText className="w-10 h-10 mb-2 opacity-50" />
              <p>No graded assignments to visualize.</p>
            </div>
          )}
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden shadow-sm">
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
                          <span className="text-xl font-bold text-[var(--text-main)] print:text-black">
                            {Math.round((Number(item.sub.grade) / Number(item.asn.marks)) * 100) || 0}%
                          </span>
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
                        <span className="text-xl font-bold text-[var(--text-main)]">
                          {Math.round((Number(item.sub.grade) / Number(item.asn.marks)) * 100) || 0}%
                        </span>
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
