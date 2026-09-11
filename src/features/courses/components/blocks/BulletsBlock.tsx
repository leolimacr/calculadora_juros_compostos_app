import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  title?: string;
  items: string[];
}

const BulletsBlock: React.FC<Props> = ({ title, items }) => (
  <div className="mb-5">
    {title && (
      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
    )}
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <CheckCircle2
            size={16}
            className="text-emerald-500 mt-0.5 shrink-0"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default BulletsBlock;
