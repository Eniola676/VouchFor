import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { GridBackground } from '@/components/ui/grid-background';
import CommissionsTable from '@/components/affiliate/CommissionsTable';
import { cn } from '@/lib/utils';

export default function CommissionsPage() {
  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row bg-black w-full flex-1 min-h-screen",
      "overflow-hidden relative"
    )}>
      <GridBackground />
      <div className="relative z-10">
        <AffiliateSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-white mb-2">Commissions</h1>
            <p className="text-sm text-gray-400">View your commission history and earnings</p>
          </div>
          
          <CommissionsTable />
        </div>
      </div>
    </div>
  );
}

