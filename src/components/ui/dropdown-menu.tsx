import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

const DropdownContext = createContext<{ close: () => void } | null>(null);

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const closeDropdown = () => setIsOpen(false);

  return (
    <DropdownContext.Provider value={{ close: closeDropdown }}>
      <div className="relative" ref={dropdownRef}>
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={closeDropdown}
            />
            <div
              className={cn(
                "absolute z-50 mt-2 min-w-[200px] rounded-lg border shadow-lg",
                "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
                "py-1",
                align === 'right' ? 'right-0' : 'left-0'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    context?.close();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-4 py-2 text-sm cursor-pointer transition-colors",
        "text-gray-900 dark:text-gray-100",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div
      className={cn(
        "h-px bg-gray-200 dark:bg-gray-800 my-1",
        className
      )}
    />
  );
}

