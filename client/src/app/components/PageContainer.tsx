'use client';
import React, { ReactNode } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`relative min-h-screen bg-gradient-to-b from-[#2c3138] to-black ${className}`}>
      {/* Language Switcher - Top Right Corner */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Page Content */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
}
