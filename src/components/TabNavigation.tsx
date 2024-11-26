import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabNavigation = ({ tabs, activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="mb-6">
      <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 mb-4 shadow-sm">
        <nav 
          className="flex gap-2 overflow-x-auto scrollbar-hide" 
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative min-w-[120px] py-2.5 px-4 rounded-md font-medium text-sm
                transition-all duration-300 ease-in-out select-none
                hover:bg-white/50 focus:outline-none focus-visible:ring-0
                active:scale-95
                ${activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
                }
              `}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="relative z-10 pointer-events-none">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-white rounded-md shadow-sm"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: 0 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-200
                        hover:shadow-lg border border-gray-100">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 