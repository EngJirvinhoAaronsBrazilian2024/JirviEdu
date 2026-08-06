import React, { useRef } from 'react';
import { Student } from '../../types';
import { Printer, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion } from 'motion/react';

interface ResultSlipProps {
  student: Student;
  results: { mod: any; asn: any; sub: any }[];
  onClose: () => void;
}

export default function StudentResultSlip({ student, results, onClose }: ResultSlipProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const totalCourses = results.length;
  const totalEarned = results.reduce((acc, curr) => acc + (Number(curr.sub.grade) || 0), 0);
  const totalPossible = results.reduce((acc, curr) => acc + (Number(curr.asn.marks) || 0), 0);
  const overallPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
  const overallResult = overallPercentage >= 50 ? 'PASS' : 'FAIL';

  const handleDownload = async () => {
    if (!slipRef.current) return;
    try {
      const element = slipRef.current;
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      let pdfWidth = pdf.internal.pageSize.getWidth();
      let pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      if (pdfHeight > pageHeight) {
        // If it's too tall, scale down proportionally to fit page height
        pdfHeight = pageHeight;
        pdfWidth = (canvas.width * pdfHeight) / canvas.height;
      }
      
      // Center horizontally if scaled down by height
      const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 0, pdfWidth, pdfHeight);
      pdf.save(`${student.regNumber || 'Student'}_Result_Slip.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 print:p-0 print:bg-white overflow-y-auto"
    >
      <div className="fixed top-4 right-4 flex space-x-3 print:hidden z-[60]">
        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white text-gray-800 rounded-lg shadow hover:bg-gray-50 font-semibold transition-colors">
          <Printer className="w-4 h-4 mr-2 hidden sm:block" />
          Print
        </button>
        <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-semibold transition-colors">
          <Download className="w-4 h-4 mr-2 hidden sm:block" />
          PDF
        </button>
        <button onClick={onClose} className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-4xl my-auto print:m-0 mt-16 sm:mt-auto mb-16 sm:mb-auto">
        <div 
          ref={slipRef}
          className="bg-white text-gray-900 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none w-full mx-auto p-6 sm:p-10"
          style={{ minHeight: '297mm', boxSizing: 'border-box', position: 'relative' }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start border-b-2 border-blue-600 pb-6 mb-8 text-center sm:text-left space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <img src="/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight uppercase">Jirvinho Software World</h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">Excellence in Education Technology</p>
              </div>
            </div>
            <div className="sm:text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-1">STUDENT RESULT SLIP</h2>
              <p className="text-sm font-semibold text-gray-600">Academic Year: {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
              <p className="text-sm font-semibold text-gray-600">Semester: II</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Date Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 shadow-sm text-center sm:text-left">
            <div className="w-24 h-24 bg-blue-100 border-2 border-blue-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-500 font-bold text-xs p-2">No Photo<br/>Provided</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 w-full">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-lg font-bold text-gray-800">{student.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Number</p>
                <p className="text-lg font-bold text-blue-700">{student.regNumber}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Programme / Course</p>
                <p className="text-md font-semibold text-gray-700">{student.course}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Year of Study</p>
                <p className="text-md font-semibold text-gray-700">Year {student.year || 1}</p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Course Code</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Course Name</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Marks</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Grade</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.map((res, idx) => {
                  const marksEarned = Number(res.sub.grade) || 0;
                  const marksTotal = Number(res.asn.marks) || 0;
                  const percent = marksTotal > 0 ? (marksEarned / marksTotal) * 100 : 0;
                  let gradeLetter = 'F';
                  let badgeColor = 'bg-red-100 text-red-800 border-red-200';
                  
                  if (percent >= 80) { gradeLetter = 'A'; badgeColor = 'bg-green-100 text-green-800 border-green-200'; }
                  else if (percent >= 70) { gradeLetter = 'B'; badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'; }
                  else if (percent >= 60) { gradeLetter = 'C'; badgeColor = 'bg-blue-100 text-blue-800 border-blue-200'; }
                  else if (percent >= 50) { gradeLetter = 'D'; badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'; }

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4 text-sm font-bold text-gray-700">{res.mod.code}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{res.mod.name}</td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-700">{marksEarned} <span className="text-gray-400 text-xs">/ {marksTotal}</span></td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border ${badgeColor}`}>
                          {gradeLetter}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-medium italic">
                        {percent >= 50 ? 'Pass' : 'Fail'}
                      </td>
                    </tr>
                  )
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">No results found for this student.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Courses</p>
                <p className="text-3xl font-extrabold text-blue-700">{totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
            </div>
            <div className={`border rounded-xl p-5 flex items-center justify-between shadow-sm ${overallResult === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${overallResult === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>Overall Result</p>
                <p className={`text-3xl font-extrabold ${overallResult === 'PASS' ? 'text-green-700' : 'text-red-700'}`}>{overallResult}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallResult === 'PASS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {overallResult === 'PASS' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
            </div>
          </div>

          {/* Lecturer's Comment */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Lecturer's Comment</h3>
            <div className="w-full h-20 border-b-2 border-dashed border-gray-300 relative">
              <span className="absolute bottom-1 left-0 text-gray-400 italic text-sm">Excellent performance, keep it up!</span>
            </div>
          </div>

          {/* Verification */}
          <div className="flex justify-between items-end mb-16 pt-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Verification Code</p>
              <p className="text-lg font-mono font-bold text-gray-800 tracking-wider">JRV-{Math.floor(Math.random() * 90000) + 10000}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mb-2 shadow-inner">
                 {/* QR Code Placeholder */}
                 <div className="w-16 h-16 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JjYmNiIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxIi8+PHJlY3QgeD0iMTQiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxIi8+PHJlY3QgeD0iMyIgeT0iMTQiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxIi8+PHBhdGggZD0iTTE0IDE0aDcuNXY3LjVIMTR6Ii8+PHBhdGggZD0iTTcgN2guMDFNMTggN2guMDFNNyAxOGguMDFNMTEgMTR2M00xNCAxMXYzeiIvPjwvc3ZnPg==')] bg-contain bg-no-repeat bg-center opacity-40"></div>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Scan to Verify</span>
            </div>
            <div className="text-center">
              <div className="w-48 h-12 border-b border-gray-400 mb-2 relative">
                <svg className="absolute bottom-1 left-4 w-32 h-10 text-blue-900/60" viewBox="0 0 200 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 40 Q40 10 60 40 T100 40 T140 20 T180 50" />
                  <path d="M40 30 Q70 50 120 30" />
                </svg>
              </div>
              <p className="text-xs font-bold text-gray-700 uppercase">Authorized Signature</p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 w-full px-6 sm:px-10 pb-6 sm:pb-8">
            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 font-medium space-y-4 sm:space-y-0">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-gray-700">Jirvinho software world</p>
                <p>jirvinhosoftwareworld@gmail.com</p>
              </div>
              <div className="space-y-1 text-center">
                <p>Tel: 0700400063 / 0760289823</p>
                <p>www.jirvinhosoftwareworld.com</p>
              </div>
              <div className="space-y-1 text-center sm:text-right">
                <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
                <p>Ref: JSW-RSLIP-{new Date().getFullYear()}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Global styles for printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root {
            visibility: hidden;
          }
          .fixed.inset-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
          }
          .fixed.inset-0 * {
            visibility: visible;
          }
          .fixed.inset-0, .fixed.inset-0 > div, .bg-white {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          /* Ensure text colors are preserved in print */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          
          /* We don't want page breaks inside the slip */
          .bg-white {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </motion.div>
  );
}
