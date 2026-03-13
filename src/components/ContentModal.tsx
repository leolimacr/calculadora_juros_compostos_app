import React from 'react';

export default ({ children, isOpen }: any) =>
  isOpen ? (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        {children}
      </div>
    </div>
  ) : null;
