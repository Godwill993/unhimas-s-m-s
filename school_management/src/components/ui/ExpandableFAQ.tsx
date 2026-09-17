import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface ExpandableFAQProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

export const ExpandableFAQ: React.FC<ExpandableFAQProps> = ({
  items,
  title = 'Frequently Asked Questions',
  subtitle = 'Find quick answers regarding UNHIMAS portal, results verification, and academic procedures.',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-2">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{subtitle}</p>}

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="py-3.5">
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between text-left group focus:outline-none"
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                    isOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="mt-2.5 pr-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed animate-fadeIn">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
