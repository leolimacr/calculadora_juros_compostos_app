import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-black prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Aqui nós estilizamos cada elemento HTML gerado pelo Markdown
          h1: ({node, ...props}) => <h1 className="text-4xl text-white mb-6 mt-8" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl text-white mb-4 mt-8 border-b border-slate-800 pb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl text-slate-200 mb-3 mt-6" {...props} />,
          p: ({node, ...props}) => <p className="text-slate-500 mb-4 leading-relaxed text-base" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside text-slate-500 mb-4 pl-4 space-y-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside text-slate-500 mb-4 pl-4 space-y-2" {...props} />,
          strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 bg-slate-900/50 text-slate-300 italic mb-4" {...props} />,
          img: ({node, ...props}) => <img className="rounded-2xl border border-slate-800 shadow-xl my-8 max-w-full h-auto" {...props} alt={props.alt || "Imagem da notícia"} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
