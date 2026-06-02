interface LabelSidebarProps {
    showZoomTrack?: boolean;
    showSubtitlesTrack?: boolean;
    showAudioTrack?: boolean;
}

export default function LabelSidebar({
    showZoomTrack = true,
    showSubtitlesTrack = false,
    showAudioTrack = false
}: LabelSidebarProps) {
    return (
        <div className="sticky left-0 top-0 bottom-0 w-16 shrink-0 border-r border-white/10 flex flex-col bg-[#0D0D11] z-30 select-none">
            {/* Ruler spacer */}
            <div className="h-7 border-b border-white/10 shrink-0" />

            {/* Video Label */}
            <div className="h-16 flex items-center px-3 shrink-0">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Video</span>
            </div>

            {/* Zoom Label */}
            {showZoomTrack && (
                <div className="h-12 flex items-center px-3 border-t border-white/5 shrink-0">
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Zoom</span>
                </div>
            )}

            {/* Subtitles Label */}
            {showSubtitlesTrack && (
                <div className="h-8 flex items-center px-3 border-t border-white/5 bg-purple-500/[0.02] shrink-0">
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-purple-400 font-bold">Sub AI</span>
                </div>
            )}

            {/* Audio Label */}
            {showAudioTrack && (
                <div className="h-10 flex items-center px-3 border-t border-white/5 bg-white/[0.02] shrink-0">
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Audio</span>
                </div>
            )}
        </div>
    );
}