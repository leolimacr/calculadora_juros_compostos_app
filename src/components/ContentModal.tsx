import React from 'react';

export default ({ children, isOpen }: any) =>
  isOpen ? (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2.5rem] w-full max-w-md md:max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh] md:overflow-visible">
        {children}
      </div>
    </div>
  ) : null;
