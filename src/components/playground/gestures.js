import { useRef } from "react";

function pointFrom(event) {
  return { x: event.clientX, y: event.clientY };
}

export function useCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function useItemGestures({ item, onOpen, onSelect, onContext }) {
  const skipClick = useRef(false);
  const lastTap = useRef(0);
  const pressTimer = useRef(0);
  const openTimer = useRef(0);
  const origin = useRef({ x: 0, y: 0 });
  const coarse = useCoarsePointer();

  function clearPress() {
    window.clearTimeout(pressTimer.current);
  }

  function showContext(point) {
    skipClick.current = true;
    window.clearTimeout(openTimer.current);
    onContext?.(item, point);
  }

  return {
    onClick(event) {
      if (event.button !== 0) return;
      if (skipClick.current) {
        skipClick.current = false;
        event.preventDefault();
        return;
      }

      if (coarse) {
        const now = Date.now();
        if (now - lastTap.current < 420) {
          window.clearTimeout(openTimer.current);
          lastTap.current = 0;
          showContext(pointFrom(event));
          return;
        }
        lastTap.current = now;
        onSelect?.(item.id);
        window.clearTimeout(openTimer.current);
        const target = event.currentTarget;
        openTimer.current = window.setTimeout(() => onOpen?.(item, target), 420);
        return;
      }

      onSelect?.(item.id);
      onOpen?.(item, event.currentTarget);
    },
    onContextMenu(event) {
      event.preventDefault();
      showContext(pointFrom(event));
    },
    onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      origin.current = pointFrom(event);
      clearPress();
      const point = pointFrom(event);
      pressTimer.current = window.setTimeout(() => showContext(point), 500);
    },
    onPointerMove(event) {
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      if (dx * dx + dy * dy > 100) clearPress();
    },
    onPointerUp: clearPress,
    onPointerCancel: clearPress,
  };
}
