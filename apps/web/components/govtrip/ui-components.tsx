'use client';

import React from 'react';
import { cn } from './utils';

export const Badge = ({ children, variant, className }: { children: React.ReactNode, variant: string, className?: string }) => {
    const styles: Record<string, string> = {
        success: "bg-emerald-100 text-emerald-800 border-emerald-200",
        warning: "bg-amber-100 text-amber-800 border-amber-200",
        danger: "bg-rose-100 text-rose-800 border-rose-200",
        neutral: "bg-slate-100 text-slate-800 border-slate-200",
        navy: "bg-slate-800 text-white border-slate-700"
    };
    return (
        <span className={cn(`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border tracking-wide uppercase ${styles[variant] || styles.neutral}`, className)}>
            {children}
        </span>
    );
};

export const Card = ({ title, subtitle, children, action, className }: { title: string, subtitle?: string, children: React.ReactNode, action?: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col", className)}>
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
            <div>
                <h3 className="font-extrabold text-slate-800 text-xs md:text-sm uppercase tracking-wider">{title}</h3>
                {subtitle && <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
            </div>
            {action}
        </div>
        <div className="p-6 flex-1">{children}</div>
    </div>
);
