"use client";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";

type Props = {
    href: string;
    label: string;
    iconSrc: string;
};

export const SidebarItem = ({ 
    href, 
    label, 
    iconSrc 
}: Props) => {
    const pathname = usePathname();
    const active = pathname === href;
    return (
        <Button variant={active ? "sidebar":"sidebar"} className="justify-start h-[52px]" asChild>
            <Link href={href}>
            <Image
                src={iconSrc}
                alt={label}
                className="mr-5"
                height={32}
                width={32}
            />
            {label}
            </Link>
        </Button>
    );
};