"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { AudioFragmentTrackItemProps, MIN_FRAGMENT_DURATION, MIN_VISUAL_WIDTH_PX } from "@/types/audio.types";

export function AudioFragmentTrackItem({
    track,
    audio,
    isSelected,
    contentWidth,
    videoDuration,
    otherTracks,
    onSelect,
    onUpdate,
    onDragStateChange,
    onMouseEnter,
    onMouseLeave,
}: AudioFragmentTrackItemProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fragmentX = useMotionValue(0);
    const fragmentWidth = useMotionValue(0);

    const timeToPixels = useCallback((time: number) => {
        return (time / videoDuration) * contentWidth;
    }, [videoDuration, contentWidth]);

    const pixelsToTime = useCallback((pixels: number) => {
        return (pixels / contentWidth) * videoDuration;
    }, [contentWidth, videoDuration]);

    const initialLeft = timeToPixels(track.startTime);
    const initialWidth = timeToPixels(track.duration);
    
    const visualWidth = Math.max(initialWidth, MIN_VISUAL_WIDTH_PX);

    useEffect(() => {
        if (!isDragging && !isResizing) {
            fragmentX.set(initialLeft);
            fragmentWidth.set(visualWidth);
        }
    }, [initialLeft, visualWidth, isDragging, isResizing, fragmentX, fragmentWidth]);

    const boundaries = useMemo(() => {
        const sorted = [...otherTracks]
            .filter(t => t.id !== track.id)
            .sort((a, b) => a.startTime - b.startTime);

        let minStart = 0;
        let maxEnd = videoDuration;

        for (const other of sorted) {
            const otherEnd = other.startTime + other.duration;
            const trackEnd = track.startTime + track.duration;

            if (otherEnd <= track.startTime) {
                minStart = Math.max(minStart, otherEnd);
            }
            if (other.startTime >= trackEnd) {
                maxEnd = Math.min(maxEnd, other.startTime);
                break;
            }
        }

        return { minStart, maxEnd };
    }, [otherTracks, track.id, track.startTime, track.duration, videoDuration]);

    // ── Drag (mover fragmento completo) ──────────────────────────────
    const handleDrag = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        let newX = currentX + info.delta.x;

        const minX = timeToPixels(boundaries.minStart);
        const maxX = timeToPixels(boundaries.maxEnd - track.duration);
        newX = Math.max(minX, Math.min(maxX, newX));

        fragmentX.set(newX);
    }, [contentWidth, videoDuration, fragmentX, track.duration, boundaries, timeToPixels]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        onDragStateChange?.(false);

        const newStartTime = pixelsToTime(fragmentX.get());
        onUpdate({
            startTime: Math.max(0, Math.min(videoDuration - track.duration, newStartTime)),
        });
    }, [fragmentX, pixelsToTime, track.duration, videoDuration, onUpdate, onDragStateChange]);

    const handleResizeStartDrag = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        const currentWidth = fragmentWidth.get();

        let newX = currentX + info.delta.x;
        let newWidth = currentWidth - info.delta.x;

        const minWidth = timeToPixels(MIN_FRAGMENT_DURATION);
        if (newWidth < minWidth) {
            newWidth = minWidth;
            newX = currentX + currentWidth - minWidth;
        }

        const minX = timeToPixels(boundaries.minStart);
        if (newX < minX) {
            newWidth = newWidth - (minX - newX);
            newX = minX;
        }

        if (audio) {
            const maxWidth = timeToPixels(audio.duration);
            if (newWidth > maxWidth) {
                const diff = newWidth - maxWidth;
                newX = newX + diff;
                newWidth = maxWidth;
            }
        }

        fragmentX.set(newX);
        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentX, fragmentWidth, boundaries, timeToPixels, audio]);

    const handleResizeEndDrag = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        const currentWidth = fragmentWidth.get();
        let newWidth = currentWidth + info.delta.x;

        const minWidth = timeToPixels(MIN_FRAGMENT_DURATION);
        newWidth = Math.max(minWidth, newWidth);

        const maxWidth = timeToPixels(boundaries.maxEnd) - currentX;
        newWidth = Math.min(newWidth, maxWidth);

        if (audio) {
            newWidth = Math.min(newWidth, timeToPixels(audio.duration));
        }

        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentWidth, fragmentX, boundaries, timeToPixels, audio]);

    const handleResizeStart = useCallback((handle: 'start' | 'end') => {
        setIsResizing(handle);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(null);
        onDragStateChange?.(false);

        const newStartTime = pixelsToTime(fragmentX.get());
        const newDuration = pixelsToTime(fragmentWidth.get());

        onUpdate({
            startTime: Math.max(0, newStartTime),
            duration: Math.min(audio?.duration ?? videoDuration, newDuration),
        });
    }, [fragmentX, fragmentWidth, pixelsToTime, audio, videoDuration, onUpdate, onDragStateChange]);

    const isInteracting = isDragging || isResizing !== null;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            ref={containerRef}
            className={`absolute h-[80%] top-[10%] rounded-md flex items-center border transition-shadow select-none ${isSelected || isInteracting
                    ? 'border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)] z-10'
                    : 'border-sky-500/35 hover:border-sky-500/60'
                } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                x: fragmentX,
                width: fragmentWidth,
                background: isSelected || isInteracting
                    ? 'linear-gradient(180deg, rgba(14, 165, 233, 0.4) 0%, rgba(3, 105, 161, 0.3) 100%)'
                    : 'linear-gradient(180deg, rgba(3, 105, 161, 0.2) 0%, rgba(12, 74, 96, 0.15) 100%)',
                boxShadow: isSelected || isInteracting
                    ? 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 10px rgba(56,189,248,0.2)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
            drag="x"
            dragConstraints={{ left: 0, right: contentWidth }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            whileTap={{ scale: 0.99 }}
        >
            {/* Minimalist Waveform Background Decoration */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[1.5px] opacity-[0.18] h-[50%] pointer-events-none select-none">
                <div className="w-[1.5px] h-[30%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[60%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[40%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[80%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[50%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[70%] bg-sky-300 rounded-full" />
                <div className="w-[1.5px] h-[35%] bg-sky-300 rounded-full" />
            </div>

            {/* Content (Icon & Text) */}
            <div className="flex-1 flex items-center justify-start pointer-events-none overflow-hidden px-3 gap-2 h-full">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 ${isSelected || isInteracting ? 'text-sky-300' : 'text-sky-400/80'}`}
                >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
                <div className="flex flex-col min-w-0">
                    <span className={`text-[9px] font-semibold truncate leading-tight ${isSelected || isInteracting ? 'text-sky-100' : 'text-sky-200/80'}`}>
                        {audio?.name || "Audio Track"}
                    </span>
                    <span className={`text-[8px] font-medium truncate leading-tight mt-0.5 ${isSelected || isInteracting ? 'text-sky-300/60' : 'text-sky-400/40'}`}>
                        {track.duration.toFixed(1)}s
                    </span>
                </div>
            </div>

            {/* Resize handle - Start */}
            <motion.div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center"
                animate={{ opacity: isHovered || isResizing === 'start' ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeStartDrag}
                onDragStart={(e) => { e.stopPropagation(); handleResizeStart('start'); }}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`w-1 h-5 rounded-full transition-all ${isResizing === 'start'
                        ? 'bg-sky-300 scale-110'
                        : 'bg-sky-400/60 group-hover/resize:bg-sky-300'
                    }`} />
            </motion.div>

            {/* Resize handle - End */}
            <motion.div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center"
                animate={{ opacity: isHovered || isResizing === 'end' ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeEndDrag}
                onDragStart={(e) => { e.stopPropagation(); handleResizeStart('end'); }}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`w-1 h-5 rounded-full transition-all ${isResizing === 'end'
                        ? 'bg-sky-300 scale-110'
                        : 'bg-sky-400/60 group-hover/resize:bg-sky-300'
                    }`} />
            </motion.div>
        </motion.div>
    );
}