import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99 }}
          onClick={() => setSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
