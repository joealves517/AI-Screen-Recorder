"use client";

import { useCallback, useMemo } from "react";
import type { EditorMode, EditorModeConfig } from "@/types/editor-mode.types";
import { getEditorModeConfig } from "@/types/editor-mode.types";

interface UseEditorModeReturn {
    mode: EditorMode;
    config: EditorModeConfig;
    isVideoMode: boolean;
    isPhotoMode: boolean;
    setMode: (mode: EditorMode) => void;
}

export function useEditorMode(): UseEditorModeReturn {
    const mode: EditorMode = "video";

    const config = useMemo(() => getEditorModeConfig(mode), [mode]);
    
    const isVideoMode = true;
    const isPhotoMode = false;

    const setMode = useCallback((newMode: EditorMode) => {
        // Photo mode disabled
    }, []);

    return {
        mode,
        config,
        isVideoMode,
        isPhotoMode,
        setMode,
    };
}


