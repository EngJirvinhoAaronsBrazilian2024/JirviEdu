/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/Login';
import AdminPortal from './components/AdminPortal';
import StudentPortal from './components/StudentPortal';

export default function App() {
  const [role, setRole] = useState<string | null>(localStorage.getItem('jirvi_role'));

  useEffect(() => {
    if (role) {
      localStorage.setItem('jirvi_role', role);
    } else {
      localStorage.removeItem('jirvi_role');
    }
  }, [role]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={role ? <Navigate to={role === 'admin' ? "/admin" : "/student"} /> : <Login setRole={setRole} />} />
        <Route path="/admin/*" element={role === 'admin' ? <AdminPortal setRole={setRole} /> : <Navigate to="/" />} />
        <Route path="/student/*" element={role === 'student' ? <StudentPortal setRole={setRole} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

