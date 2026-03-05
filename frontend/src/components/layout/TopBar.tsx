import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, User } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function TopBar() {
  const { t } = useTranslation('common');
  const { user, logout } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <LanguageSwitcher />
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-4 h-4" />
              {user.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-400">{t('auth.anonymousMode')}</span>
        )}
      </div>
    </header>
  );
}
