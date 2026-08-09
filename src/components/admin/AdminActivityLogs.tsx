import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, where } from '../../lib/db';
import { Activity, Clock, User, Filter, Download } from 'lucide-react';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.docs.forEach((doc: any) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by timestamp descending
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setLogs(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching logs:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.userType === filter);

  const exportToCSV = () => {
    const csvData = [
      ['Action', 'Details', 'User ID', 'Role', 'Timestamp'],
      ...filteredLogs.map(log => [
        `"${(log.action || '').replace(/"/g, '""')}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        `"${(log.userId || '').replace(/"/g, '""')}"`,
        `"${(log.userType || '').replace(/"/g, '""')}"`,
        `"${new Date(log.createdAt || log.timestamp || Date.now()).toISOString()}"`
      ])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-50">Activity Logs</h1>
          <p className="mt-1 text-sm text-neutral-400">Monitor usage and actions across the application.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 border border-neutral-600 rounded-md shadow-sm text-sm font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> 
            Export CSV
          </button>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-neutral-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-neutral-800 text-neutral-50">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-neutral-800 shadow-sm border border-neutral-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-neutral-400">Loading activities...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-400">No activities logged yet.</div>
        ) : (
          <ul className="divide-y divide-neutral-700">
            {filteredLogs.map((log) => (
              <li key={log.id} className="p-4 hover:bg-neutral-700/50 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-blue-400">{log.action}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-sm text-neutral-300">{log.details}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-neutral-400">
                        <User className="w-3.5 h-3.5 mr-1" />
                        {log.userId} ({log.userType})
                      </div>
                      <div className="flex items-center text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
