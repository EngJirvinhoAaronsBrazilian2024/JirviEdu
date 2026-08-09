import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, doc, getDoc } from '../../lib/db';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, CartesianAxis } from 'recharts';
import { X, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Student } from '../../types';

export default function StudentPerformance({ student, onClose }: { student: Student, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [averageGrade, setAverageGrade] = useState(0);
  const [riskFailing, setRiskFailing] = useState(false);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const modulesSnap = await getDocs(collection(db, 'modules'));
        const grades: any[] = [];
        let totalPct = 0;
        let count = 0;

        for (const modDoc of modulesSnap.docs) {
          const modData = modDoc.data();
          const assignmentsSnap = await getDocs(collection(db, `modules/${modDoc.id}/assignments`));
          
          for (const aDoc of assignmentsSnap.docs) {
            const aData = aDoc.data();
            const subDoc = await getDoc(doc(db, `modules/${modDoc.id}/assignments/${aDoc.id}/submissions`, student.id));
            
            if (subDoc.exists()) {
              const subData = subDoc.data();
              if (subData.grade !== undefined && aData.marks) {
                const pct = (Number(subData.grade) / Number(aData.marks)) * 100;
                grades.push({
                  name: aData.title,
                  grade: Math.round(pct),
                  date: subData.submittedAt
                });
                totalPct += pct;
                count++;
              }
            }
          }
        }

        grades.sort((a, b) => a.date - b.date);
        setPerformanceData(grades.map(g => ({ ...g, date: new Date(g.date).toLocaleDateString() })));
        
        const avg = count > 0 ? totalPct / count : 0;
        setAverageGrade(avg);
        setRiskFailing(avg < 40 && count > 0);
      } catch (err) {
        console.error("Failed to fetch performance", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformance();
  }, [student.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="premium-card w-full max-w-4xl flex flex-col relative z-10 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-card)] rounded-t-2xl shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">Performance: {student.fullName}</h3>
            <p className="text-sm text-muted font-medium">{student.regNumber} - {student.course}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-[var(--text-main)] transition-colors p-2 rounded-full hover:bg-[var(--bg-app)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-muted font-medium">Loading performance data...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
                  <p className="text-sm font-semibold text-muted">Average Grade</p>
                  <div className="flex items-end gap-2 mt-1">
                    <p className="text-3xl font-bold text-[var(--text-main)]">{Math.round(averageGrade)}%</p>
                    {averageGrade >= 70 ? (
                      <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
                    ) : averageGrade < 40 ? (
                      <TrendingDown className="w-5 h-5 text-red-500 mb-1" />
                    ) : null}
                  </div>
                </div>
                
                <div className="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)]">
                  <p className="text-sm font-semibold text-muted">Total Assignments Graded</p>
                  <p className="text-3xl font-bold text-[var(--text-main)] mt-1">{performanceData.length}</p>
                </div>
                
                <div className={`p-4 rounded-xl border ${riskFailing ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-500/20' : 'bg-[var(--bg-app)] border-[var(--border-subtle)]'}`}>
                  <p className={`text-sm font-semibold ${riskFailing ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>Academic Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {riskFailing ? (
                      <>
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">At Risk</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">Good Standing</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 border border-[var(--border-strong)] rounded-xl p-4 md:p-6 bg-[var(--bg-card)]">
                <h4 className="text-lg font-bold text-[var(--text-main)] mb-6">Grade Trends Over Time</h4>
                {performanceData.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} tickFormatter={v => `${v}%`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '0.75rem', color: 'var(--text-main)' }}
                          itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                          formatter={(value: number) => [`${value}%`, 'Grade']}
                          labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                        />
                        <Line type="monotone" dataKey="grade" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted py-12">Not enough data to display trends.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
