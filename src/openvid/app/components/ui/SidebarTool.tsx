"use client";

import { Icon } from "@iconify/react";
import { ReactNode, forwardRef, useState, useRef } from "react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";

interface PopoverConfig {
    title: string;
    description: string;
    videoSrc?: string;
}

interface SidebarToolProps {
    icon: string | ReactNode;
    label?: string;
    isActive?: boolean;
    onClick?: () => void;
    badge?: string;
    badgeCount?: number;
    disabled?: boolean;
    popover?: PopoverConfig;
}

export const SidebarTool = forwardRef<HTMLButtonElement, SidebarToolProps>(
    ({ icon, label, isActive, onClick, badge, badgeCount, disabled, popover }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

        const handleMouseEnter = () => {
            if (disabled) return;
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setIsOpen(true);
            }, 700);
        };

        const handleMouseLeave = () => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setIsOpen(false);
            }, 150);
        };

        const ToolButton = (
            <button
                ref={ref}
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                className={`relative flex flex-col items-center gap-1.5 transition-all duration-200 w-full ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    } ${isActive ? "text-white" : "text-white/60 hover:text-white"}`}
            >
                {badgeCount !== undefined && badgeCount > 0 && (
                    <div className="absolute -top-1 right-1 z-10 min-w-4 h-4 px-1 flex items-center justify-center bg-emerald-500 rounded-full border border-emerald-400 shadow-lg pointer-events-none animate-in zoom-in-50 duration-200">
                        <span className="text-[9px] font-bold text-white leading-none">
                            {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                    </div>
                )}
                {badge && (
                    <div className="absolute -top-1 -right-0.5 z-10 px-1.5 py-0.5 bg-linear-to-r from-gray-500 to-gray-500 rounded-full border border-white/20 shadow-lg pointer-events-none">
                        <span className="text-[8px] font-bold text-white tracking-widest uppercase block drop-shadow-sm leading-none">
                            {badge}
                        </span>
                    </div>
                )}
                {isActive && !disabled && (
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent mx-2" />
                )}
                <span
                    className={`flex items-center justify-center p-3 squircle-element transition-all duration-200 relative ${!disabled && isActive ? "" : "hover:bg-white/5"
                        } `}
                    style={
                        isActive && !disabled
                            ? {
                                background:
                                    "radial-gradient(circle at 50% 0%, #555555 0%, #454545 64%)",
                                boxShadow:
                                    "inset 0 1.01rem 0.2rem -1rem #fff, 0 0 0 1px #fff4, 0 4px 4px 0 #0004, 0 0 0 1px #333",
                            }
                            : {}
                    }
                >
                    <div
                        className={`transition-transform duration-300 ${isActive && !disabled ? "scale-110" : !disabled ? "hover:scale-105" : ""
                            }`}
                    >
                        {typeof icon === "string" ? (
                            <Icon icon={icon} width="20" aria-hidden="true" />
                        ) : (
                            <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
                        )}
                    </div>
                    {isActive && !disabled && (
                        <div className="absolute left-1 w-8 h-2 top-1/5 -translate-y-1/2 size-3 bg-white rounded-full blur-[5px] rotate-45 opacity-50" />
                    )}
                </span>
                {label && (
                    <label
                        className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${disabled ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                    >
                        {label}
                    </label>
                )}
            </button>
        );

        if (!popover || disabled) {
            return ToolButton;
        }

        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => e.preventDefault()}
                        className="w-full flex justify-center"
                    >
                        {ToolButton}
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    sideOffset={16}
                    className="w-56 p-3 bg-[#18181b]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden pointer-events-none"
                >
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-bold text-white leading-tight">
                            {popover.title}
                        </h3>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                            {popover.description}
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
);

SidebarTool.displayName = "SidebarTool";