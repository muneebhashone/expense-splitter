import { Users, PlusCircle, Receipt, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: JSX.Element;
  content: React.ReactNode;
}

interface BottomNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const BottomNavigation = ({ tabs, activeTab, onTabChange }: BottomNavigationProps) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'friends':
        return <Users className="w-6 h-6" />;
      case 'new-expense':
        return <PlusCircle className="w-6 h-6" />;
      case 'expenses':
        return <Receipt className="w-6 h-6" />;
      case 'settlements':
        return <Wallet className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getTabColor = (id: string) => {
    switch (id) {
      case 'friends':
        return 'text-blue-600';
      case 'new-expense':
        return 'text-green-600';
      case 'expenses':
        return 'text-purple-600';
      case 'settlements':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="pb-20 min-h-[calc(100vh-12rem)]"
      >
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 transition-all duration-200
                      hover:shadow-lg border border-gray-100">
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </motion.div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center w-full h-full
                  transition-colors duration-200 relative
                  ${activeTab === tab.id ? getTabColor(tab.id) : 'text-gray-400'}
                `}
              >
                <div className="relative">
                  {getIcon(tab.id)}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="bottomNav"
                      className="absolute -inset-1 bg-current opacity-10 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};
