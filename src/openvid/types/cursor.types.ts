/**
 * Cursor Types - Defines the structure for custom cursor overlays on recorded videos
 * 
 * This system captures mouse position during screen recording and allows
 * replacing the native cursor with customizable cursor styles in the editor/export.
 */

/** Cursor state based on CSS cursor property detected during recording */
export type CursorState = 
    | "default"   // Normal arrow cursor
    | "pointer"   // Hand/pointer (hover on buttons/links)
    | "text"      // I-beam for text selection
    | "grab"      // Open hand for dragging
    | "grabbing"  // Closed hand while dragging
    | "wait"      // Loading spinner
    | "progress"  // Loading with arrow
    | "not-allowed" // Disabled/forbidden
    | "crosshair" // Precision selection
    | "move"      // Move/drag indicator
    | "resize";   // Resize handles (simplified, covers all resize variants)

/** A single keyframe of cursor position and state */
export interface CursorKeyframe {
    /** Time in seconds from video start */
    time: number;
    /** X position as percentage of video width (0-100) */
    x: number;
    /** Y position as percentage of video height (0-100) */
    y: number;
    /** Current cursor state/style */
    state: CursorState;
    /** Whether the mouse button is currently pressed */
    clicking: boolean;
}

/** Cursor style/theme options */
export type CursorStyle = "none" | "mac" | "windows" | "dot";

/** Click effect animation options */
export type ClickEffect = "none" | "ripple" | "ring";

/** Cursor configuration for the editor */
export interface CursorConfig {
    /** Which cursor style to display */
    style: CursorStyle;
    /** Main cursor color (for customizable cursors) */
    color: string;
    /** Cursor size multiplier (1 = default, 2 = double size, etc.) */
    size: number;
    /** Position smoothing factor (0 = no smoothing, 100 = max smoothing) */
    smoothing: number;
    /** Effect when clicking */
    clickEffect: ClickEffect;
    /** Click effect color */
    clickEffectColor: string;
    /** Whether to show cursor (master toggle) */
    visible: boolean;
}

/** Default cursor configuration */
export const DEFAULT_CURSOR_CONFIG: CursorConfig = {
    style: "mac",
    color: "#FFFFFF",
    size: 32,
    smoothing: 50,
    clickEffect: "ripple",
    clickEffectColor: "#3B82F6",
    visible: true,
};

/** Recorded cursor data stored with video */
export interface CursorRecordingData {
    /** Array of cursor keyframes captured during recording */
    keyframes: CursorKeyframe[];
    /** Original video dimensions used during recording */
    videoDimensions: {
        width: number;
        height: number;
    };
    /** Recording frame rate (for interpolation reference) */
    frameRate: number;
    /** Whether this recording has cursor data (false if captured without CaptureController support) */
    hasCursorData: boolean;
}

/** Empty cursor recording data */
export const EMPTY_CURSOR_DATA: CursorRecordingData = {
    keyframes: [],
    videoDimensions: { width: 1920, height: 1080 },
    frameRate: 60,
    hasCursorData: false,
};

/**
 * Helper function to interpolate cursor position between keyframes
 * for smooth cursor movement at any playback time
 */
export function interpolateCursorPosition(
    keyframes: CursorKeyframe[],
    time: number,
    smoothing: number = 50
): CursorKeyframe | null {
    if (keyframes.length === 0) return null;
    
    // Find the two keyframes surrounding the current time
    let prevFrame: CursorKeyframe | null = null;
    let nextFrame: CursorKeyframe | null = null;
    
    for (let i = 0; i < keyframes.length; i++) {
        if (keyframes[i].time <= time) {
            prevFrame = keyframes[i];
        }
        if (keyframes[i].time >= time && !nextFrame) {
            nextFrame = keyframes[i];
            break;
        }
    }
    
    // If no previous frame, return first frame
    if (!prevFrame) return keyframes[0];
    
    // If no next frame, return last frame
    if (!nextFrame) return keyframes[keyframes.length - 1];
    
    // If same frame, return it
    if (prevFrame === nextFrame) return prevFrame;
    
    // Calculate interpolation factor
    const duration = nextFrame.time - prevFrame.time;
    const progress = (time - prevFrame.time) / duration;
    
    // Apply smoothing using easeInOutCubic
    const smoothingFactor = smoothing / 100;
    const easedProgress = easeInOutCubic(progress) * smoothingFactor + progress * (1 - smoothingFactor);
    
    // Interpolate position
    return {
        time,
        x: lerp(prevFrame.x, nextFrame.x, easedProgress),
        y: lerp(prevFrame.y, nextFrame.y, easedProgress),
        state: progress < 0.5 ? prevFrame.state : nextFrame.state,
        clicking: prevFrame.clicking || nextFrame.clicking,
    };
}

/** Linear interpolation */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Easing function for smooth cursor movement */
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Check if browser supports CaptureController API for cursor capture */
export function supportsCursorCapture(): boolean {
    if (typeof window === 'undefined') return false;
    return 'CaptureController' in window;
}
