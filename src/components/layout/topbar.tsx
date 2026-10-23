interface TopbarProps {
  userName: string;
  companyName: string;
}

export function Topbar({ userName, companyName }: TopbarProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{companyName}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
