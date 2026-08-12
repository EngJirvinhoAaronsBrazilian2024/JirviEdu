const fs = require('fs');

let code = fs.readFileSync('src/components/NotificationBell.tsx', 'utf8');

code = code.replace(
  /<div className="absolute right-0 mt-2 [\s\S]*?(?=<div className="max-h-80)/,
  \`<div className="fixed inset-x-4 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 bg-[var(--bg-card)] rounded-xl shadow-2xl sm:shadow-lg border border-[var(--border-subtle)] overflow-hidden z-50">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]">
            <h3 className="font-bold text-[var(--text-main)]">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          \`
);
fs.writeFileSync('src/components/NotificationBell.tsx', code);
