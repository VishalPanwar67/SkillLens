import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LogIn,
  LayoutDashboard,
  FileUp,
  Clock,
  CheckSquare,
  Target,
  Building2,
  TrendingUp,
  FileText,
  Map,
  Eye,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sections = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'P3' },
        { name: 'Resume Upload', path: '/resume', icon: FileUp, badge: 'P4' },
        { name: 'Skill Quiz', path: '/quiz', icon: Clock, badge: 'P5' },
        { name: 'Quiz Results', path: '/results', icon: CheckSquare, badge: 'NEW', isNew: true },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { name: 'Company Match', path: '/match', icon: Target, badge: 'P6' },
        { name: 'Company Detail', path: '/company', icon: Building2, badge: 'NEW', isNew: true },
        { name: 'Interview', path: '/interview', icon: TrendingUp, badge: 'P7' },
        { name: 'Interview Summary', path: '/summary', icon: FileText, badge: 'NEW', isNew: true },
        { name: 'Roadmap', path: '/roadmap', icon: Map, badge: 'P8' },
        { name: 'Learning System', path: '/learning', icon: BookOpen, badge: 'NEW', isNew: true },
        { name: 'Profile / Settings', path: '/profile', icon: Settings, badge: 'NEW', isNew: true },
      ],
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] z-40 hidden lg:flex flex-col
        bg-white/80 backdrop-blur-xl border-r border-[rgba(0,157,119,0.12)]
        px-4 py-5 overflow-y-auto custom-scrollbar"
    >
      <Link to="/" className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#E8FAF5] flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-[#009D77]" />
        </div>
        <span className="text-base font-extrabold tracking-tight">
          <span className="text-[#011813]">Skill</span>
          <span className="text-[#009D77]">Lens</span>
        </span>
      </Link>

      <nav className="flex-1 flex flex-col min-h-0">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8D8E8F] px-2 mt-4 mb-1 first:mt-0">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (location.pathname === '/' && item.path === '/dashboard');
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#009D77] text-white'
                        : 'text-[#313233] hover:bg-[#E8FAF5] hover:text-[#009D77]'
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-[#8D8E8F]'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span
                      className={`text-[10px] font-bold shrink-0 ${
                        item.isNew
                          ? isActive
                            ? 'px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30'
                            : 'px-2 py-0.5 rounded-full bg-[#E8FAF5] text-[#009D77] border border-[rgba(0,157,119,0.2)]'
                          : isActive
                            ? 'px-1.5 py-0.5 rounded-md bg-white/20 text-white'
                            : 'px-1.5 py-0.5 rounded-md bg-[#F0F0F0] text-[#8D8E8F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="my-3 h-px bg-[#F0F0F0] shrink-0" />

      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 text-[#EA4C89] hover:bg-[#FCE4EE]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-[#EA4C89]" />
          <span>Logout</span>
        </button>
      ) : (
        <Link
          to="/login"
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
            location.pathname === '/login'
              ? 'bg-[#009D77] text-white'
              : 'text-[#313233] hover:bg-[#E8FAF5] hover:text-[#009D77]'
          }`}
        >
          <LogIn className={`w-4 h-4 flex-shrink-0 ${location.pathname === '/login' ? 'text-white' : 'text-[#8D8E8F]'}`} />
          <span>Login</span>
        </Link>
      )}
    </aside>
  );
}
