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
  Zap,
  CreditCard
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const [credits, setCredits] = React.useState(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      const fetchCredits = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch("http://localhost:5800/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setCredits(data.data.user.credits);
          }
        } catch (err) {
          console.error("Sidebar credit fetch error", err);
        }
      };
      fetchCredits();
    }
  }, [isAuthenticated, location.pathname]); // Refresh on route change

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
        { name: 'Pricing / Credits', path: '/pricing', icon: CreditCard, badge: 'OFFER', isNew: true },
        { name: 'Profile / Settings', path: '/profile', icon: Settings, badge: 'NEW', isNew: true },
      ],
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] z-40 hidden lg:flex flex-col
        bg-white border-r border-[#E7E7E8]
        px-3 py-4 overflow-y-auto custom-scrollbar"
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

      {/* Main Nav - Now scrollable area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#98A2B3] px-3 mb-2 leading-none opacity-80">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (location.pathname === '/' && item.path === '/dashboard');
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group/item ${
                        isActive
                          ? 'bg-[#009D77] text-white shadow-md shadow-[#009D77]/10'
                          : 'text-[#313233] hover:bg-[#F8F9FA] hover:text-[#009D77]'
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-[#98A2B3] group-hover/item:text-[#009D77]'
                        }`}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black shrink-0 px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.isNew 
                                ? 'bg-[#E8FAF5] text-[#009D77]' 
                                : 'bg-[#F0F2F5] text-[#98A2B3]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Actions - Now strictly separated */}
      <div className="pt-4 mt-auto space-y-4 border-t border-[#F0F2F5]">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[#EA4C89] hover:bg-pink-50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Log out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[#313233] hover:bg-gray-50 transition-colors"
          >
            <LogIn className="w-4 h-4 flex-shrink-0 text-[#98A2B3]" />
            <span>Login</span>
          </Link>
        )}

        {isAuthenticated && credits !== null && (
          <div className="pb-2">
            <Link to="/pricing" className="bg-[#011813] rounded-2xl p-4 block group relative overflow-hidden transition-all shadow-xl shadow-[#011813]/20 hover:scale-[1.02]">
              {/* Design accents */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#009D77]/10 -mr-8 -mt-8 rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-[0.1em]">Intelligence Card</span>
                  <Zap className="w-2.5 h-2.5 text-[#2EEAAB]" />
                </div>
                
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-black text-white leading-none">{credits}</span>
                  <span className="text-[9px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest">Credits</span>
                </div>
                
                <div className="w-full py-2 bg-[#009D77] rounded-lg text-[9px] font-black text-white uppercase tracking-wider transition-all group-hover:bg-[#00AC82] flex items-center justify-center gap-1.5 focus:outline-none">
                  Add More <Zap className="w-2 h-2" />
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
