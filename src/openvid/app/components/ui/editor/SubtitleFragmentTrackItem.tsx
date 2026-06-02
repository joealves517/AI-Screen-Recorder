"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Icon } from "@iconify/react";

// Minimum subtitle duration in seconds to prevent collapsing to 0
const MIN_SUBTITLE_DURATION = 0.5;

interface SubtitleSegment {
    start: number;
    end: number;
    text: string;
}

interface SubtitleFragmentTrackItemProps {
    segment: SubtitleSegment;
    index: number;
    isSelected: boolean;
    contentWidth: number;
    videoDuration: number;
    otherSegments: SubtitleSegment[];
    onSelect: () => void;
    onUpdate: (index: number, updates: Partial<SubtitleSegment>) => void;
    onDragStateChange?: (isDragging: boolean) => void;
}

export function SubtitleFragmentTrackItem({
    segment,
    index,
    isSelected,
    contentWidth,
    videoDuration,
    otherSegments,
    onSelect,
    onUpdate,
    onDragStateChange,
}: SubtitleFragmentTrackItemProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fragmentX = useMotionValue(0);
    const fragmentWidth = useMotionValue(0);

    const timeToPixels = useCallback((time: number) => {
        return (time / videoDuration) * contentWidth;
    }, [videoDuration, contentWidth]);

    const pixelsToTime = useCallback((pixels: number) => {
        return (pixels / contentWidth) * videoDuration;
    }, [contentWidth, videoDuration]);

    const initialLeft = timeToPixels(segment.start);
    const initialWidth = timeToPixels(segment.end - segment.start);

    // Sync pixel positions when segment time parameters change externally
    useEffect(() => {
        if (!isDragging && !isResizing) {
            fragmentX.set(initialLeft);
            fragmentWidth.set(initialWidth);
        }
    }, [initialLeft, initialWidth, isDragging, isResizing, fragmentX, fragmentWidth]);

    // Compute boundaries based on neighboring segments to prevent overlap
    const boundaries = useMemo(() => {
        const sorted = [...otherSegments].sort((a, b) => a.start - b.start);

        let minStart = 0;
        let maxEnd = videoDuration;

        for (const other of sorted) {
            if (other.end <= segment.start) {
                minStart = Math.max(minStart, other.end);
            }
            if (other.start >= segment.end) {
                maxEnd = Math.min(maxEnd, other.start);
                break;
            }
        }

        return { minStart, maxEnd };
    }, [otherSegments, segment.start, segment.end, videoDuration]);

    const handleDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        const duration = segment.end - segment.start;

        let newX = currentX + info.delta.x;

        const minX = timeToPixels(boundaries.minStart);
        const maxX = timeToPixels(boundaries.maxEnd - duration);
        newX = Math.max(minX, Math.min(maxX, newX));

        fragmentX.set(newX);
    }, [contentWidth, videoDuration, fragmentX, segment, boundaries, timeToPixels]);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        onDragStateChange?.(false);

        const newStartTime = pixelsToTime(fragmentX.get());
        const duration = segment.end - segment.start;

        onUpdate(index, {
            start: Math.max(0, newStartTime),
            end: Math.min(videoDuration, newStartTime + duration),
        });
    }, [fragmentX, pixelsToTime, segment, videoDuration, index, onUpdate, onDragStateChange]);

    const handleResizeStartDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentX = fragmentX.get();
        const currentWidth = fragmentWidth.get();

        let newX = currentX + info.delta.x;
        let newWidth = currentWidth - info.delta.x;

        const minWidth = timeToPixels(MIN_SUBTITLE_DURATION);
        if (newWidth < minWidth) {
            newWidth = minWidth;
            newX = currentX + currentWidth - minWidth;
        }

        const minX = timeToPixels(boundaries.minStart);
        if (newX < minX) {
            const diff = minX - newX;
            newX = minX;
            newWidth = currentWidth - diff;
        }

        fragmentX.set(newX);
        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentX, fragmentWidth, boundaries, timeToPixels]);

    const handleResizeEndDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number } }) => {
        if (contentWidth === 0 || videoDuration === 0) return;

        const currentWidth = fragmentWidth.get();

        let newWidth = currentWidth + info.delta.x;

        const minWidth = timeToPixels(MIN_SUBTITLE_DURATION);
        newWidth = Math.max(minWidth, newWidth);

        const currentX = fragmentX.get();
        const maxWidth = timeToPixels(boundaries.maxEnd) - currentX;
        newWidth = Math.min(newWidth, maxWidth);

        fragmentWidth.set(newWidth);
    }, [contentWidth, videoDuration, fragmentWidth, fragmentX, boundaries, timeToPixels]);

    const handleResizeStart = useCallback((handle: 'start' | 'end') => {
        setIsResizing(handle);
        onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(null);
        onDragStateChange?.(false);

        const newStartTime = pixelsToTime(fragmentX.get());
        const newEndTime = pixelsToTime(fragmentX.get() + fragmentWidth.get());

        onUpdate(index, {
            start: Math.max(0, newStartTime),
            end: Math.min(videoDuration, newEndTime),
        });
    }, [fragmentX, fragmentWidth, pixelsToTime, videoDuration, index, onUpdate, onDragStateChange]);

    const isInteracting = isDragging || isResizing !== null;

    return (
        <motion.div
            ref={containerRef}
            className={`absolute h-[80%] top-[10%] rounded-md flex items-center border transition-all select-none group/subitem ${
                isSelected || isInteracting
                    ? 'border-purple-400/80 z-20'
                    : 'border-purple-500/40 hover:border-purple-400/60'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                x: fragmentX,
                width: fragmentWidth,
                background: isSelected || isInteracting
                    ? 'linear-gradient(180deg, rgba(147, 51, 234, 0.45) 0%, rgba(107, 33, 168, 0.35) 100%)'
                    : 'linear-gradient(180deg, rgba(126, 34, 206, 0.18) 0%, rgba(88, 28, 135, 0.12) 100%)',
                boxShadow: isSelected || isInteracting
                    ? 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 10px rgba(147,51,234,0.3)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
            drag="x"
            dragConstraints={{ left: 0, right: contentWidth }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileTap={{ scale: 0.99 }}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={videoDuration}
            aria-valuenow={segment.start}
            aria-label={`Subtitle AI segment #${index + 1}`}
            tabIndex={0}
        >
            {/* Resize handle - Start */}
            <motion.div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeStartDrag}
                onDragStart={() => handleResizeStart('start')}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
                role="slider"
                aria-label="Resize start"
                tabIndex={0}
            >
                <div className={`w-0.5 h-4 rounded transition-all ${
                    isResizing === 'start' ? 'bg-purple-300 scale-110' : 'bg-purple-400/40 group-hover/resize:bg-purple-300'
                }`} />
            </motion.div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-between pointer-events-none overflow-hidden px-2 h-full">
                <span className={`text-[8px] font-sans truncate pr-2 ${
                    isSelected || isInteracting ? 'text-purple-100 font-semibold' : 'text-purple-300/80'
                }`}>
                    {segment.text}
                </span>
            </div>

            {/* Resize handle - End */}
            <motion.div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group/resize flex items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleResizeEndDrag}
                onDragStart={() => handleResizeStart('end')}
                onDragEnd={handleResizeEnd}
                onClick={(e) => e.stopPropagation()}
                role="slider"
                aria-label="Resize end"
                tabIndex={0}
            >
                <div className={`w-0.5 h-4 rounded transition-all ${
                    isResizing === 'end' ? 'bg-purple-300 scale-110' : 'bg-purple-400/40 group-hover/resize:bg-purple-300'
                }`} />
            </motion.div>
        </motion.div>
    );
}
