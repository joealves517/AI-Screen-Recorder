import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

// When isActive is omitted entirely, it defaults to undefined → hover mode.
// When isActive is explicitly passed (true OR false) → click/prop-driven mode only.
export const AnimatedIcon = React.forwardRef(({ children, animation = "hover", isActive, isLooping, className, ...props }, forwardedRef) => {
  const innerContainerRef = useRef(null);
  const iconRef = useRef(null);
  const prevActiveRef = useRef(false);

  // Whether the caller is controlling activation via prop
  const isPropDriven = isActive !== undefined;

  // Combine forwardedRef and innerContainerRef
  const containerRef = (node) => {
    innerContainerRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  // Trigger animation when isActive transitions from false → true
  useEffect(() => {
    if (!isPropDriven) return;
    
    let intervalId;
    
    if (isActive) {
      if (!prevActiveRef.current) {
        iconRef.current?.startAnimation?.();
      }
      
      if (isLooping) {
        intervalId = setInterval(() => {
          iconRef.current?.startAnimation?.();
        }, 2500); // Trigger built-in animation every 2.5s to prevent abrupt zoom in/out
      }
    } else {
      if (prevActiveRef.current) {
        iconRef.current?.stopAnimation?.();
      }
    }
    
    prevActiveRef.current = isActive;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, isPropDriven, isLooping]);

  // Attach hover listeners ONLY when isActive is NOT provided
  useEffect(() => {
    if (isPropDriven) return;
    const el = innerContainerRef.current;
    if (!el) return;

    const parent = el.closest(
      'button, a, [role="button"], [role^="menuitem"], [role="option"], [class*="button"], [class*="item"], [class*="DropdownMenuItem"], [class*="SelectItem"], .popup-control, .TabsTrigger'
    ) || el.parentElement;

    if (!parent) return;

    const handleMouseEnter = () => iconRef.current?.startAnimation?.();
    const handleMouseLeave = () => iconRef.current?.stopAnimation?.();

    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isPropDriven]);

  let whileHover = {};
  let transition = {};

  switch (animation) {
    case "hover":
      whileHover = { scale: 1.15 };
      transition = { type: "spring", stiffness: 400, damping: 10 };
      break;
    case "bounce":
      whileHover = { y: -2 };
      transition = { type: "spring", stiffness: 300, damping: 15 };
      break;
    case "spin":
      whileHover = { rotate: 90 };
      transition = { type: "spring", stiffness: 200, damping: 15 };
      break;
    default:
      whileHover = { scale: 1.15 };
      transition = { type: "spring", stiffness: 400, damping: 10 };
      break;
  }

  // Clone child to attach ref
  const childWithRef = React.isValidElement(children)
    ? React.cloneElement(children, { ref: iconRef })
    : children;

  return (
    <motion.span
      ref={containerRef}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}
      whileHover={animation === "none" ? {} : whileHover}
      whileTap={animation === "none" ? {} : { scale: 0.9 }}
      transition={transition}
      {...props}
    >
      {childWithRef}
    </motion.span>
  );
});
