import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#082A5E] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${className}`}
      title={label}
    >
      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
