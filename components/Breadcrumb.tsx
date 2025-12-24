import React from 'react';

interface BreadcrumbProps {
  items: { label: string; action?: () => void }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 no-print">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {item.action ? (
            <button onClick={item.action} className="hover:text-emerald-400 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className={idx === items.length - 1 ? "text-slate-200 font-medium" : ""}>
              {item.label}
            </span>
          )}
          {idx < items.length - 1 && <span className="text-slate-600">/</span>}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;