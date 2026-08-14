/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import StudentPortal from './components/StudentPortal';
import TeacherPortal from './components/TeacherPortal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  const [role, setRole] = useState<string | null>(sessionStorage.getItem('jirvi_role') || localStorage.getItem('jirvi_role'));

  useEffect(() => {
    if (!role) {
      sessionStorage.removeItem('jirvi_role');
      localStorage.removeItem('jirvi_role');
    }
  }, [role]);

  useEffect(() => {
    let timeoutId: any;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (role) {
        // 15 minutes of inactivity
        timeoutId = setTimeout(() => {
          setRole(null);
          sessionStorage.clear();
          localStorage.removeItem('jirvi_role');
          localStorage.removeItem('jirvi_student_reg');
          localStorage.removeItem('jirvi_student_id');
        }, 900000);
      }
    };

    if (role) {
      resetTimer();
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(e => document.addEventListener(e, resetTimer));

      return () => {
        clearTimeout(timeoutId);
        events.forEach(e => document.removeEventListener(e, resetTimer));
      };
    }
  }, [role]);

  return (
    <Router>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={role ? <Navigate to={role === 'admin' ? "/admin" : role === 'teacher' ? "/teacher" : "/student"} /> : <Login setRole={setRole} />} />
        <Route path="/admin/*" element={role === 'admin' ? <AdminPortal setRole={setRole} /> : <Navigate to="/" />} />
        <Route path="/teacher/*" element={role === 'teacher' ? <TeacherPortal setRole={setRole} /> : <Navigate to="/" />} />
        <Route path="/student/*" element={role === 'student' ? <StudentPortal setRole={setRole} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

