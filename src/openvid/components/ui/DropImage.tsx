import { Icon } from "@iconify/react";

export default function DropImage() {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-4 text-white mask-[radial-gradient(circle,black_50%,transparent_95%)]">
                <Icon icon="hugeicons:image-upload" width="120" />
                <div className="text-xl font-semibold uppercase tracking-wider">
                    Suelta la imagen
                </div>
            </div>
        </div>
    );
}