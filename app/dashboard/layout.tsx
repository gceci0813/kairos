'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IconHome, 
  IconChartBar, 
  IconMap, 
  IconUsers, 
  IconSettings, 
  IconActivity,
  IconSignalH,
  IconLocation,
  IconChevronDown,
  IconChevronRight,
  IconBrain,
  IconEye
} from '@tabler/icons-react';

interface NavItem {
  label: string;
  href: string;
  Icon: any;
  sub?: string;
  children?: NavItem[];
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', Icon: IconHome, sub: 'Main dashboard' },
  { label: 'Analytics', href: '/dashboard/analytics', Icon: IconChartBar, sub: 'Data analytics & metrics' },
  { label: 'Map', href: '/dashboard/map', Icon: IconMap, sub: 'Interactive map view' },
  { label: 'Network', href: '/dashboard/network', Icon: IconUsers, sub: 'Network analysis' },
  { label: 'Activity', href: '/dashboard/activity', Icon: IconActivity, sub: 'Activity monitoring' },
  { label: 'Location Intelligence', href: '/location-test', Icon: IconLocation, sub: 'Real geolocation analysis' },
  { label: 'Social Intel', href: '/location-test/social-intel', Icon: IconSignalH, sub: 'Real-time social media intelligence' },
  { label: 'ORACLE', href: '/dashboard/oracle', Icon: IconBrain, sub: 'Predictive analysis' },
  { label: 'SIGMA', href: '/dashboard/sigma', Icon: IconEye, sub: 'Surveillance & monitoring' },
  { label: 'Settings', href: '/dashboard/settings', Icon: IconSettings, sub: 'System settings' }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const activeParents = baseNavItems.filter(item => 
      item.children && item.children.some(child => child.href === pathname)
    ).map(item => item.label);
    
    setExpandedItems(activeParents);
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div className="w-full">
        <div
          className={`
            flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors
            ${isActive 
              ? 'bg-blue-50 text-blue-700 font-medium' 
              : 'text-gray-700 hover:bg-gray-50'
            }
            ${level > 0 ? 'ml-6' : ''}
          `}
        >
          <Link href={item.href} className="flex items-center flex-1">
            <item.Icon size={18} className="mr-3 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(item.label);
              }}
              className="p-1 rounded hover:bg-gray-100"
            >
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </button>
          )}
        </div>
        {item.sub && (
          <div className="text-xs text-gray-500 ml-9 mr-3 truncate">
            {item.sub}
          </div>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map((child, index) => (
              <NavItemComponent key={index} item={child} level={1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white shadow-md`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Kairos</h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <IconChevronRight 
                  size={18} 
                  className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {baseNavItems.map((item, index) => (
                <li key={index}>
                  <NavItemComponent item={item} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 text-center">
              {sidebarOpen ? 'Kairos Intelligence Platform' : 'KAIROS'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}