import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        bg-white
        border border-border
        rounded-[var(--radius-card)]
        p-8
        shadow-[var(--shadow-card)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
