import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Custom hook to make an element draggable via a designated drag handle.
 *
 * @param {Object} options
 * @param {boolean} options.disabled - Whether dragging is disabled
 * @returns {{ position, isDragging, hasDragged, dragHandleProps, containerStyle, resetPosition }}
 */
const useDraggable = ({ disabled = false } = {}) => {
  // null = user hasn't dragged yet, use default CSS positioning
  const [offset, setOffset] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef(null);
  const elementStartRef = useRef(null);
  const elementRef = useRef(null);

  const elementSizeRef = useRef(null);

  const handleMouseDown = useCallback(
    (e) => {
      if (disabled) return;
      // Only respond to primary button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const targetEl = elementRef.current;
      if (!targetEl) return;

      const rect = targetEl.getBoundingClientRect();

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      elementStartRef.current = { x: rect.left, y: rect.top };
      elementSizeRef.current = { width: rect.width, height: rect.height };

      setIsDragging(true);
    },
    [disabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!dragStartRef.current || !elementStartRef.current || !elementSizeRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newX = elementStartRef.current.x + deltaX;
      const newY = elementStartRef.current.y + deltaY;

      // Clamp within viewport bounds using size captured at drag start
      const { width, height } = elementSizeRef.current;

      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - width));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - height));

      hasDraggedRef.current = true;
      setOffset({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      elementStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const resetPosition = useCallback(() => {
    setOffset(null);
    hasDraggedRef.current = false;
  }, []);

  const setRef = useCallback((node) => {
    elementRef.current = node;
  }, []);

  const dragHandleProps = {
    onMouseDown: handleMouseDown,
    style: {
      cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
      touchAction: "none",
    },
  };

  // When offset is set, use fixed positioning at exact coordinates
  const containerStyle = offset
    ? {
        position: "fixed",
        left: `${offset.x}px`,
        top: `${offset.y}px`,
        transition: isDragging ? "none" : "left 0.15s ease, top 0.15s ease",
      }
    : {};

  return {
    offset,
    isDragging,
    hasDragged: hasDraggedRef.current,
    dragHandleProps,
    containerStyle,
    resetPosition,
    setRef,
  };
};

export default useDraggable;
