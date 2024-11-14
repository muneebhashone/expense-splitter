import { HandCoins, Save, Upload } from 'lucide-react';

interface HeaderProps {
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Header({ onExportData, onImportData }: HeaderProps) {
  return (
    <div className="text-center py-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
        <HandCoins className="h-8 w-8 text-blue-500" />
        Expense Splitter
      </h1>
      <p className="text-gray-600 mt-2">Split expenses easily with friends</p>
      
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={onExportData}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Save className="h-4 w-4" />
          Export Data
        </button>
        
        <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
          <Upload className="h-4 w-4" />
          Import Data
          <input
            type="file"
            accept=".json"
            onChange={onImportData}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
