import { ReactNode } from 'react';

interface PageProps {
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
  title?: string;
}

export default function Page({ children, className = '', sidebar, title }: PageProps) {
  return (
    <div className={`min-h-screen flex bg-gray-100 ${className}`}>
      {sidebar && (
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          {sidebar}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        {title && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 