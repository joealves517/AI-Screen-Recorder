import { Icon } from "@iconify/react";
import { Toggle } from "./toggle";

export function SectionToggle({
    icon,
    title,
    description,
    enabled,
    onToggle,
    children,
    error,
}: {
    icon: string;
    title: string;
    description: React.ReactNode;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children?: React.ReactNode;
    error?: string | null;
}) {
    return (
        <div className="squircle-element border border-white/10 bg-white/3">
            <label className="flex items-center justify-between p-3 cursor-pointer">
                <div className="flex items-start gap-2.5">
                    <Icon icon={icon} className="size-5 text-neutral-400 mt-0.5 transition-colors" />
                    <div>
                        <div className="text-sm text-neutral-200 font-medium transition-colors">{title}</div>
                        <div className="text-[11px] text-neutral-500 transition-colors">{description}</div>
                    </div>
                </div>
                <Toggle checked={enabled} onChange={onToggle} />
            </label>

            <div
                className={`grid transition-all duration-300 ease-in-out ${enabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="px-3 pb-3">
                        {error && (
                            <div className="mb-2 rounded-md bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-[11px] text-red-300">
                                {error}
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}