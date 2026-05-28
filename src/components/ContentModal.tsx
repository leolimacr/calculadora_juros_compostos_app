import React from 'react';

export default ({ children, isOpen }: any) =>
  isOpen ? (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        {children}
      </div>
    </div>
  ) : null;
