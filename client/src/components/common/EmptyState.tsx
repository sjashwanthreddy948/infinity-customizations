import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0B3A82] mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-[#0B3A82]" />
      </div>
      <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center gap-2.5 justify-center">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/15 border border-[#D4AF37]/40 transition-all active:scale-95 cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
