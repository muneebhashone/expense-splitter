import { HandCoins } from 'lucide-react';

interface HeaderProps {
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  activeTab: string;
}

const tabThemes = {
  friends: 'from-blue-500/10 to-transparent',
  'new-expense': 'from-green-500/10 to-transparent',
  expenses: 'from-purple-500/10 to-transparent',
  settlements: 'from-orange-500/10 to-transparent',
};

type TabThemeKey = keyof typeof tabThemes;

export function Header({ activeTab }: HeaderProps) {
  const gradientClass = tabThemes[activeTab as TabThemeKey] || tabThemes.friends;
  const accentColor = {
    friends: 'text-blue-600',
    'new-expense': 'text-green-600',
    expenses: 'text-purple-600',
    settlements: 'text-orange-600',
  }[activeTab as TabThemeKey] || 'text-blue-600';

  return (
    <div className={`text-center py-8 bg-gradient-to-b ${gradientClass} transition-all duration-500`}>
      <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3 mb-3">
        <HandCoins className={`h-10 w-10 ${accentColor} animate-bounce transition-colors duration-500`} />
        Expense Splitter
      </h1>
      <p className="text-muted-foreground text-lg">Split expenses easily with friends</p>
    </div>
  );
}
