import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Sparkles,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Plus,
  ExternalLink,
  Play,
  Menu,
  Filter,
  Megaphone,
  MessageSquare,
  Bell,
  Mail,
  Send,
  Heart,
  ThumbsUp,
  Star,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingCart,
  ShieldCheck,
  Zap,
  Box,
  Layers,
  Layout,
  Image,
  Video,
  Calendar,
  Clock,
  User,
  Users,
  Globe,
  Lock,
  Award,
  Bookmark,
  Briefcase,
  Camera,
  Coffee,
  Cpu,
  Download,
  Eye,
  FileText,
  Gift,
  HelpCircle,
  Key,
  Laptop,
  Lightbulb,
  MapPin,
  Maximize,
  Moon,
  Phone,
  Rocket,
  Settings,
  Smile,
  Sun,
  Tag,
  Target,
  Terminal,
  Trash2,
  Tv,
  Unlock,
  Upload,
  Wifi
} from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon?: string;
}

const ICON_REGISTRY: { name: string; component: React.FC<{ className?: string }>; category: string }[] = [
  // Actions & Navigation
  { name: 'ArrowRight', component: ArrowRight, category: 'Navigation' },
  { name: 'ArrowLeft', component: ArrowLeft, category: 'Navigation' },
  { name: 'ChevronRight', component: ChevronRight, category: 'Navigation' },
  { name: 'Compass', component: Compass, category: 'Navigation' },
  { name: 'ExternalLink', component: ExternalLink, category: 'Navigation' },
  { name: 'Play', component: Play, category: 'Navigation' },
  { name: 'CheckCircle', component: CheckCircle, category: 'Navigation' },
  { name: 'Plus', component: Plus, category: 'Navigation' },
  { name: 'Search', component: Search, category: 'Navigation' },
  { name: 'Filter', component: Filter, category: 'Navigation' },
  { name: 'Menu', component: Menu, category: 'Navigation' },

  // Communication & Marketing
  { name: 'Megaphone', component: Megaphone, category: 'Marketing' },
  { name: 'Star', component: Star, category: 'Marketing' },
  { name: 'Heart', component: Heart, category: 'Marketing' },
  { name: 'ThumbsUp', component: ThumbsUp, category: 'Marketing' },
  { name: 'Sparkles', component: Sparkles, category: 'Marketing' },
  { name: 'Award', component: Award, category: 'Marketing' },
  { name: 'Gift', component: Gift, category: 'Marketing' },
  { name: 'Rocket', component: Rocket, category: 'Marketing' },
  { name: 'Target', component: Target, category: 'Marketing' },
  { name: 'Tag', component: Tag, category: 'Marketing' },
  { name: 'MessageSquare', component: MessageSquare, category: 'Marketing' },
  { name: 'Bell', component: Bell, category: 'Marketing' },
  { name: 'Mail', component: Mail, category: 'Marketing' },
  { name: 'Send', component: Send, category: 'Marketing' },

  // SaaS & Commerce
  { name: 'TrendingUp', component: TrendingUp, category: 'SaaS' },
  { name: 'DollarSign', component: DollarSign, category: 'SaaS' },
  { name: 'CreditCard', component: CreditCard, category: 'SaaS' },
  { name: 'ShoppingCart', component: ShoppingCart, category: 'SaaS' },
  { name: 'ShieldCheck', component: ShieldCheck, category: 'SaaS' },
  { name: 'Zap', component: Zap, category: 'SaaS' },
  { name: 'Briefcase', component: Briefcase, category: 'SaaS' },
  { name: 'Cpu', component: Cpu, category: 'SaaS' },
  { name: 'Terminal', component: Terminal, category: 'SaaS' },
  { name: 'Laptop', component: Laptop, category: 'SaaS' },
  { name: 'Globe', component: Globe, category: 'SaaS' },
  { name: 'Lock', component: Lock, category: 'SaaS' },
  { name: 'Key', component: Key, category: 'SaaS' },

  // UI & Elements
  { name: 'Box', component: Box, category: 'UI' },
  { name: 'Layers', component: Layers, category: 'UI' },
  { name: 'Layout', component: Layout, category: 'UI' },
  { name: 'Image', component: Image, category: 'UI' },
  { name: 'Video', component: Video, category: 'UI' },
  { name: 'Calendar', component: Calendar, category: 'UI' },
  { name: 'Clock', component: Clock, category: 'UI' },
  { name: 'User', component: User, category: 'UI' },
  { name: 'Users', component: Users, category: 'UI' },
  { name: 'Eye', component: Eye, category: 'UI' },
  { name: 'FileText', component: FileText, category: 'UI' },
  { name: 'Lightbulb', component: Lightbulb, category: 'UI' },
  { name: 'Settings', component: Settings, category: 'UI' },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Navigation' | 'Marketing' | 'SaaS' | 'UI'>('all');

  if (!isOpen) return null;

  const filteredIcons = ICON_REGISTRY.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Vector Icon Library
            </h3>
            <p className="text-[11px] text-slate-400">
              Select an icon for buttons, cards, or steps
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 60+ vector icons..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px]">
            {['all', 'Navigation', 'Marketing', 'SaaS', 'UI'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-2.5 py-0.5 rounded-lg font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Icons */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2.5">
          {filteredIcons.map((item) => {
            const IconComp = item.component;
            const isSelected = currentIcon === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  onSelectIcon(item.name);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all group ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                }`}
                title={item.name}
              >
                <IconComp className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-medium truncate w-full">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
