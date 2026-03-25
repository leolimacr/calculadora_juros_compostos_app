import React from 'react';

interface Props {
  title?: string;
  content: string;
}

const TextBlock: React.FC<Props> = ({ title, content }) => (
  <div className="mb-5">
    {title && (
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    )}
    <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
  </div>
);

export default TextBlock;
