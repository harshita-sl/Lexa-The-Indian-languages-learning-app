"use client";

import Link from "next/link"; 
import { Check, Crown, Star, Lock } from "lucide-react";
import {
  CircularProgressbarWithChildren,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
    id: number;
    index: number;
    totalCount: number;
    current?: boolean;
    locked?: boolean;
    percentage: number;
    language?: string;
};

export const LessonButton = ({
    id,
    index,
    totalCount,
    locked,
    current,
    percentage,
    language = "Telugu"
}: Props) => {
    const cycleLength = 8;
    const cycleIndex = index % cycleLength;
    
    let indentationLevel;
    if (cycleIndex <= 2) {
        indentationLevel = cycleIndex;
    } else if (cycleIndex <= 4) {
        indentationLevel = 4 - cycleIndex;
    } else if (cycleIndex <= 6) {
        indentationLevel = 6 - cycleIndex;
    } else {
        indentationLevel = cycleIndex - 8;
    }

    const rightPosition = indentationLevel * 40;
    
    const isFirst = index === 0;
    const isLast = index === totalCount;
    const isCompleted = !current && !locked;

    const Icon = isCompleted ? Check : locked ? Lock : isLast ? Crown : Star;
    const href = `/learn/lesson/${id}?language=${encodeURIComponent(language)}`;

    return (
        <Link 
            href={href} 
            aria-disabled={locked}
            style={{ pointerEvents: locked ? "none" : "auto" }}
        >
            <div 
                className="relative flex flex-col items-center"
                style={{
                    right: `${rightPosition}px`,
                    marginTop: isFirst && !isCompleted ? "40px" : "24px",
                }}
            >
                {current ? (
                    <div className="h-[102px] w-[102px] relative flex items-center justify-center">
                        <div className="absolute -top-6 px-3 py-1.5 border-2 font-bold uppercase text-amber-500 bg-white rounded-xl animate-bounce tracking-wide z-10 text-xs shadow-md">
                            Start
                            <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-amber-500 transform -translate-x-1/2" />              
                        </div>
                        <CircularProgressbarWithChildren
                            value={Number.isNaN(percentage) ? 0 : percentage}
                            styles={{
                                path: {
                                    stroke: "#4ade80",
                                },
                                trail: {
                                    stroke: "#e5e7eb",
                                },
                            }}
                        >
                            <Button
                                size="rounded"
                                variant={locked ? "locked" : "secondary"}
                                className="h-[70px] w-[70px] border-b-8"
                            >
                                <Icon className={cn(
                                    "h-8 w-8",
                                    locked
                                        ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                                        : "fill-primary-foreground text-primary-foreground",
                                    isCompleted && "fill-none stroke-[3]"
                                )} />
                            </Button>
                        </CircularProgressbarWithChildren>
                    </div>  
                ) : (
                    <Button
                        size="rounded"
                        variant={locked ? "locked" : isCompleted ? "secondary" : "primary"}
                        className="h-[70px] w-[70px] border-b-8 shadow-sm"
                    >
                        <Icon className={cn(
                            "h-8 w-8",
                            locked
                                ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                                : "fill-primary-foreground text-primary-foreground",
                            isCompleted && "fill-none stroke-[3]"
                        )} />
                    </Button>
                )}
            </div>
        </Link>
    );
};