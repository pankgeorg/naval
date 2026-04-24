import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, Menu, User } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface Props {
  onHamburger: () => void;
}

export default function TopBar({ onHamburger }: Props) {
  const { t } = useTranslation('common');
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onHamburger}
          className="md:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {user ? (
          <>
            <span className="text-sm text-gray-600 flex items-center gap-1 min-w-0">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[140px] md:max-w-xs">{user.email}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-400 truncate">{t('auth.anonymousMode')}</span>
        )}
      </div>
    </header>
  );
}
