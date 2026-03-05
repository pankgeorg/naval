import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ship, LogIn } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation('common');

  const navItems = [
    { path: '/', label: t('nav.fleet'), icon: Ship },
    { path: '/login', label: t('nav.login'), icon: LogIn },
  ];

  return (
    <aside className="w-64 bg-maritime-900 text-white flex flex-col">
      <div className="p-4 border-b border-maritime-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Ship className="w-6 h-6" />
          {t('appTitle')}
        </h1>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                active
                  ? 'bg-maritime-700 text-white'
                  : 'text-maritime-200 hover:bg-maritime-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-maritime-400 text-xs">
        v1.0.0
      </div>
    </aside>
  );
}
