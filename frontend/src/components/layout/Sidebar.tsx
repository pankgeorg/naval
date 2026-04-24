import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ship, LogIn, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const location = useLocation();
  const { t } = useTranslation('common');

  const navItems = [
    { path: '/', label: t('nav.fleet'), icon: Ship },
    { path: '/login', label: t('nav.login'), icon: LogIn },
  ];

  // On mobile (below md): fixed-position drawer that slides in from the left.
  // On md+: static in the flex row, always visible.
  const mobileClass = open ? 'translate-x-0' : '-translate-x-full';

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-maritime-900 text-white flex flex-col
        transform transition-transform duration-200 ease-out
        ${mobileClass} md:translate-x-0
      `}
    >
      <div className="p-4 border-b border-maritime-700 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Ship className="w-6 h-6" />
          {t('appTitle')}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden text-maritime-200 hover:text-white p-1 -mr-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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
