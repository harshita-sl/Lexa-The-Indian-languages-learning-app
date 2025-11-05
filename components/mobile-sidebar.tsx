import { Menu } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";

import { Sidebar } from "@/components/sidebar";

export const MobileSidebar = () => {
    return (
        <Sheet>     
            <SheetTrigger className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition">
            <Menu className="text-white" />
            </SheetTrigger>
            <SheetContent className="p-0 z-[100] " side="left" >
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
};
