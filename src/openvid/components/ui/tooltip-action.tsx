import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
interface TooltipActionProps {
  children: React.ReactNode;
  label: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function TooltipAction({ children, label, side = "bottom" }: TooltipActionProps) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        sideOffset={5}
        className="bg-white text-black border border-gray-200 px-2 py-1 shadow-sm"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
