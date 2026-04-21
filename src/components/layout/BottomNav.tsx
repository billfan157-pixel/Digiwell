import { Home, BarChart2, Trophy, FlaskConical, Rss, User, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'home' | 'insight' | 'league' | 'bottle' | 'feed' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const BottomNav = (props: BottomNavProps) => {
  const navItems: { id: TabType; icon: any; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'insight', icon: BarChart2, label: 'Insight' },
    { id: 'league', icon: Trophy, label: 'League' },
    { id: 'bottle', icon: FlaskConical, label: 'My Bottle' },
    { id: 'feed', icon: Rss, label: 'Feed' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mx-auto max-w-md pointer-events-auto relative">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = props.activeTab === id;
          return (
            <button
              key={id}
              onClick={() => props.setActiveTab(id)}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group z-10"
            >
              {/* Cục sáng trượt theo tab (Liquid effect) */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/20 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              
              <Icon 
                size={isActive ? 22 : 20} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] -translate-y-1.5' : 'text-slate-400 group-hover:text-slate-300'}`} 
              />
              
              <span
                className={`absolute bottom-2 text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive ? 'opacity-100 text-cyan-400 translate-y-0' : 'opacity-0 translate-y-2 text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;