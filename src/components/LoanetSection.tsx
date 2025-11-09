import React from 'react';
import './LoanetSection.css';

interface LoanetSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function LoanetSection({ title, children, className = '' }: LoanetSectionProps) {
  return (
    <div className={`loanet-section ${className}`}>
      <h2 className="section-title">{title}</h2>
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

