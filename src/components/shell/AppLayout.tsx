import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CreateExperienceModal } from '../modals/CreateExperienceModal';

export const AppLayout: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onCreateClick={() => setIsCreateModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
          <Outlet context={{ openCreateModal: () => setIsCreateModalOpen(true) }} />
        </main>
      </div>

      <CreateExperienceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isGlobal={true}
      />
    </div>
  );
};
