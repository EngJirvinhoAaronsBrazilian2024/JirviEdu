import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  id: string;
  label: string;
}

export default function MultiSelect({ options, selectedIds, onChange, placeholder = "Select options..." }: { options: Option[], selectedIds: string[], onChange: (ids: string[]) => void, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSelected = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter(x => x !== id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="w-full min-h-[42px] px-3 py-2 border border-[var(--border-strong)] bg-[var(--bg-card)] rounded-xl text-sm font-medium focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedIds.length === 0 && <span className="text-muted">{placeholder}</span>}
        {selectedIds.map(id => {
          const opt = options.find(o => o.id === id);
          if (!opt) return null;
          return (
            <span key={id} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md text-xs font-bold">
              {opt.label}
              <button onClick={(e) => removeSelected(e, id)} className="hover:text-indigo-900 dark:hover:text-indigo-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        <div className="flex-1 min-w-[50px] relative">
          <input 
            type="text" 
            className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-[var(--text-main)]" 
            value={search}
            onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
            placeholder={selectedIds.length === 0 ? "" : "Search..."}
            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          />
        </div>
        <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl shadow-lg py-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted">No options found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => handleToggle(opt.id)}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-app)] cursor-pointer flex items-center justify-between"
                >
                  {opt.label}
                  {selectedIds.includes(opt.id) && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
