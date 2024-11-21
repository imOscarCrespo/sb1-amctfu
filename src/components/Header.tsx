import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
}

export default function Header({ title, showBackButton, backButtonText = 'Back' }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login', { replace: true });
  };

  return (
    <header className="header py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-white mb-2 block transition-colors"
              >
                ← {backButtonText}
              </button>
            )}
            <h1 className="text-xl font-medium text-white">{title}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}