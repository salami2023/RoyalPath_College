import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Copy, RefreshCw, X, Table, Download, Check, Sparkles, HardDrive } from 'lucide-react';
import { db } from '../database';

interface DevDatabaseViewerProps {
  onRefreshParentApp: () => void;
}

export default function DevDatabaseViewer({ onRefreshParentApp }: DevDatabaseViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [dbData, setDbData] = useState(() => db.getRawData());

  const handleRefresh = () => {
    db.reload();
    setDbData(db.getRawData());
    onRefreshParentApp();
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the school database to default baseline? This will restore all standard demo records.')) {
      db.resetDatabase();
      setDbData(db.getRawData());
      onRefreshParentApp();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(dbData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'royalpath_school_database_backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableKeys = Object.keys(dbData);

  return (
    <div className="font-sans">
      
      {/* Floating diagnostics toggler button */}
      <button
        onClick={() => {
          handleRefresh();
          setIsOpen(true);
        }}
        id="btn-dev-db-diagnostics"
        className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white p-3.5 rounded-full shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 cursor-pointer group"
        title="Open Database Inspector"
      >
        <Database className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[150px] transition-all duration-300 text-xs font-semibold whitespace-nowrap leading-none">
          Data Inspector
        </span>
      </button>

      {/* Slideover / Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Slideover Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-950 text-slate-100 z-50 shadow-2xl border-l border-slate-900 flex flex-col overflow-hidden"
            >
              
              {/* Header */}
              <div className="p-6 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                      <span>School Database Inspector</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Local Active</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Manage, inspect, backup, and restore school records and default data.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 px-2.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Actions toolbar */}
              <div className="p-4 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between text-xs gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-400">Tables:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 outline-hidden rounded px-2 py-1 text-[11px] font-mono leading-none"
                  >
                    {tableKeys.map(k => (
                      <option key={k} value={k}>{k} ({((dbData as any)[k] || []).length} rows)</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
                    title="Reload fresh records"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reload</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
                    title="Copy full database state to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
                    title="Download database backup JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 px-2 bg-rose-900/10 hover:bg-rose-900/20 text-rose-300 border border-rose-900/50 rounded flex items-center gap-1 transition-colors cursor-pointer font-bold"
                    title="Reset all tables to default data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Code viewer display */}
              <div className="flex-1 p-6 overflow-auto font-mono text-xs text-indigo-300 bg-slate-950">
                <div className="mb-4 text-[10px] text-slate-500 font-sans flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Viewing Table: <strong>{selectedTable}</strong></span>
                </div>
                <pre className="bg-slate-900 p-4 rounded-xl border border-slate-850 overflow-x-auto text-emerald-400">
                  {JSON.stringify((dbData as any)[selectedTable], null, 2)}
                </pre>
              </div>

              {/* Storage Information */}
              <div className="p-6 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 font-sans space-y-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>STANDALONE LOCAL DATA STORAGE</span>
                </h4>
                <p className="text-xs text-slate-300">
                  All school records, student enrollments, exam grades, attendance logs, and configuration changes are persisted locally. Authorized users can create, update, edit, and delete any data.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Database Mode:</span>
                    <span className="text-emerald-400 truncate block">Local Storage Active</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">CRUD Permissions:</span>
                    <span className="text-indigo-400 truncate block">Admin / Teacher / Parent</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </div>
  );
}

