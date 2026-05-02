import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export const AnimatedIcon = React.forwardRef(({ children, animation = "hover", className, ...props }, forwardedRef) => {
  const innerContainerRef = useRef(null);
  const iconRef = useRef(null);

  // Combine forwardedRef and innerContainerRef
  const containerRef = (node) => {
    innerContainerRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  useEffect(() => {
    const el = innerContainerRef.current;
    if (!el) return;

    // Find the closest logical parent container (button, menu item, row, etc.)
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
  }, []);

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
      style={animation === "none" ? { display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 } : { display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}
      whileHover={animation === "none" ? {} : whileHover}
      whileTap={animation === "none" ? {} : { scale: 0.9 }}
      transition={transition}
      {...props}
    >
      {childWithRef}
    </motion.span>
  );
});
