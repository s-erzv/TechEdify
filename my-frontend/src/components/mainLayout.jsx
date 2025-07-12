// my-frontend/src/components/mainLayout.jsx
import React from 'react';
import Sidebar from './Sidebar'; 

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#D9CBFE] overflow-hidden dark:bg-dark-bg-primary"> 
      <Sidebar />
      
      <div className="flex-1 pt-6 pr-6 pb-6 pl-0">
        
        <div className="h-[90vh] overflow-y-auto pr-2 scrollbar-hide rounded-xl">
          {children}
        </div>

      </div>
    </div>
  );
}