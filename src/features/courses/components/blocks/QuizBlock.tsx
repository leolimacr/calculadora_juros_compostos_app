import React, { useState } from 'react';

interface Props {
  question: string;
  options: string[];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  onCompleted?: () => void;             
}

const QuizBlock: React.FC<Props> = ({
  question,
  options,
  correctIndex,
  feedbackCorrect,
  feedbackIncorrect,
  onCompleted,                            
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="mb-5 border border-slate-200 rounded-xl p-4 bg-white">
      <p className="text-sm font-semibold text-slate-800 mb-3">{question}</p>
      <div className="space-y-2">
        {options.map((option, i) => {
          let style =
            'border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50';
          if (answered) {
            if (i === correctIndex)
              style = 'border border-emerald-400 bg-emerald-50 text-emerald-800';
            else if (i === selected)
              style = 'border border-red-300 bg-red-50 text-red-700';
            else
              style = 'border border-slate-100 text-slate-500 cursor-default';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => {
                setSelected(i);
                if (i === correctIndex && onCompleted) {
                  onCompleted();
                }
              }}
              className={`w-full text-left text-sm px-4 py-2.5 rounded-lg transition-all ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`mt-3 text-sm rounded-lg px-3 py-2 ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          <span className="font-semibold">
            {isCorrect ? '✓ Correto! ' : '✗ Não exatamente. '}
          </span>
          {isCorrect ? feedbackCorrect : feedbackIncorrect}
        </div>
      )}
    </div>
  );
};

export default QuizBlock;
