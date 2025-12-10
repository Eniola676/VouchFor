import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Settings, FolderKanban, HelpCircle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export function VendorSidebar() {
  const links = [
    {
      label: "Overview",
      href: "/",
      icon: (
        <LayoutDashboard className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Programs",
      href: "/programs",
      icon: (
        <FolderKanban className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Partners",
      href: "/dashboard/vendor/partners",
      icon: (
        <Users className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const bottomLinks = [
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="text-gray-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Customer Support",
      href: "/support",
      icon: (
        <HelpCircle className="text-gray-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Feature Requests & Feedback",
      href: "/feedback",
      icon: (
        <MessageSquare className="text-gray-400 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        
        {/* Bottom Section - Separated from main navigation */}
        <div className="border-t border-gray-800 pt-4 mt-auto">
          <div className="flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={link}
                className="text-gray-400 hover:text-white hover:bg-gray-900/30 rounded-md transition-colors"
              />
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white whitespace-pre"
      >
        VouchFor
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </a>
  );
};

