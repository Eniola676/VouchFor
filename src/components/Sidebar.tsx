// This file is kept for reference but may not be actively used

interface NavItem {
  name: string;
  href: string;
  active?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '#', active: true },
  { name: 'Program Setup', href: '#' },
  { name: 'Partners', href: '#' },
  { name: 'Settings', href: '#' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen
          bg-primary-900 text-white
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-primary-800">
            <h1 className="text-xl font-bold text-white">VouchFor</h1>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg
                  transition-colors duration-200
                  ${
                    item.active
                      ? 'bg-primary-800 text-white'
                      : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                  }
                `}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

