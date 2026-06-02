"use client";

import type { MockupRenderProps } from "@/types/mockup.types";
import { hexToRgba } from "@/lib/utils";

interface GlassCurveMockupProps extends MockupRenderProps {
    shadows?: number;
    roundedCorners?: number;
}

export function GlassCurveMockup({
    children,
    config,
    className = "",
    shadows = 30,
    roundedCorners,
}: GlassCurveMockupProps) {
    const isDark = config.darkMode;
    const frameColor = isDark ? config.frameColor : "#ffffff";
    const cornerRadius = roundedCorners ?? config.cornerRadius;
    
    const headerOpacity = config.headerOpacity ?? 10; 
    const headerScale = (config.headerScale || 100) / 100;
    
    const framePadding = 4 * headerScale; // Equivalente a p-1 (4px)
    const reflectionWidth = 16 * headerScale; // Equivalente a w-4 (16px)
    
    const notchTop = 16 * headerScale; // top-4
    const notchWidth = 40 * headerScale; // w-10
    const notchHeight = 4 * headerScale; // h-1
    
    const contentPaddingTop = 32 * headerScale; // pt-8
    
    const screenBg = isDark ? "#0a0a0a" : "#ffffff";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.4)";
    const reflectionColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.2)";
    const notchBg = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.05)";

    return (
        <div 
            className={`relative flex flex-col ${className}`}
        >
            <div 
                className="relative flex flex-col backdrop-blur-2xl overflow-hidden"
                style={{
                    padding: `${framePadding}px`,
                    backgroundColor: hexToRgba(frameColor, headerOpacity),
                    borderRadius: `${cornerRadius * 2.5}px`,
                    boxShadow: shadows > 0 
                        ? `0 ${shadows}px ${shadows * 2}px rgba(0,0,0,0.25)` 
                        : 'none',
                    border: `3px solid ${borderColor}`,
                }}
            >
                <div 
                    className="absolute inset-y-0 left-0 z-10 pointer-events-none"
                    style={{ 
                        width: `${reflectionWidth}px`,
                        background: `linear-gradient(to right, ${reflectionColor}, transparent)` 
                    }}
                />
                
                <div 
                    className="absolute inset-y-0 right-0 z-10 pointer-events-none"
                    style={{ 
                        width: `${reflectionWidth}px`,
                        background: `linear-gradient(to left, ${reflectionColor}, transparent)` 
                    }}
                />

                <div 
                    className="relative w-full h-full overflow-hidden flex flex-col shadow-inner"
                    style={{
                        backgroundColor: screenBg,
                        borderRadius: `${cornerRadius * 2.35}px`,
                    }}
                >
                    <div 
                        className="absolute left-1/2 -translate-x-1/2 rounded-full z-20 pointer-events-none"
                        style={{ 
                            top: `${notchTop}px`,
                            width: `${notchWidth}px`,
                            height: `${notchHeight}px`,
                            backgroundColor: notchBg
                        }}
                    />

                    <div 
                        className="relative z-10 w-full h-full"
                        style={{ 
                            paddingTop: `${contentPaddingTop}px` 
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}