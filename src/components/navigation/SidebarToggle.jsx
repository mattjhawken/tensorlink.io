import { useEffect, useRef, useState } from "react";
import { useStateContext } from "../../contexts/contextProvider";
import { SIDEBAR_WIDTH } from "./SidebarShell.jsx";

// The sidebar toggle's height (h-12 = 48px) and how close it's allowed to get to the
// top/bottom edge of the viewport while being dragged.
const TOGGLE_HEIGHT = 48;
const TOGGLE_EDGE_MARGIN = 12;
const TOGGLE_POSITION_KEY = "tensorlink_toggle_top";

const clampToggleTop = (top) => {
  const min = TOGGLE_EDGE_MARGIN;
  const max = window.innerHeight - TOGGLE_HEIGHT - TOGGLE_EDGE_MARGIN;
  return Math.min(Math.max(top, min), max);
};

// Lets the sidebar toggle be dragged up/down and remembers where the user left it
// (stored as a fraction of viewport height so it stays sensible across screen sizes).
const useDraggableToggle = (onTap) => {
  const [top, setTop] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOGGLE_POSITION_KEY) : null;
    const fraction = saved ? parseFloat(saved) : 0.5;
    const fallback = window.innerHeight * (Number.isNaN(fraction) ? 0.5 : fraction) - TOGGLE_HEIGHT / 2;
    return clampToggleTop(fallback);
  });

  const drag = useRef({ dragging: false, moved: false, startY: 0, startTop: 0, lastTop: top });

  useEffect(() => {
    const handleResize = () => setTop((prev) => clampToggleTop(prev));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e) => {
    drag.current = { dragging: true, moved: false, startY: e.clientY, startTop: top, lastTop: top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const state = drag.current;
    if (!state.dragging) return;
    const deltaY = e.clientY - state.startY;
    if (!state.moved && Math.abs(deltaY) > 4) {
      state.moved = true;
    }
    if (state.moved) {
      const newTop = clampToggleTop(state.startTop + deltaY);
      state.lastTop = newTop;
      setTop(newTop);
    }
  };

  const handlePointerUp = () => {
    const state = drag.current;
    if (!state.dragging) return;
    state.dragging = false;
    if (state.moved) {
      const fraction = (state.lastTop + TOGGLE_HEIGHT / 2) / window.innerHeight;
      localStorage.setItem(TOGGLE_POSITION_KEY, String(fraction));
    }
  };

  const handleClick = () => {
    // A drag ends with a click event too - swallow that one so it doesn't also toggle.
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    onTap();
  };

  // Double-click/tap to snap back to the vertical center, in case someone drags it
  // somewhere awkward and wants an easy way back rather than fiddling to re-drag it.
  const handleDoubleClick = () => {
    const centered = clampToggleTop(window.innerHeight / 2 - TOGGLE_HEIGHT / 2);
    setTop(centered);
    localStorage.removeItem(TOGGLE_POSITION_KEY);
  };

  return { top, handlePointerDown, handlePointerMove, handlePointerUp, handleClick, handleDoubleClick };
};


// The pull tab on the sidebar's edge. Rendered by the site layout next to the sidebar
// so its position always follows the sidebar width. Drag it up/down to reposition,
// double-click/tap to snap it back to center.
export default function SidebarToggle() {
  const { activeMenu, setActiveMenu } = useStateContext();
  const dragToggle = useDraggableToggle(() => setActiveMenu(!activeMenu));

  return (
    <button
      onClick={dragToggle.handleClick}
      onDoubleClick={dragToggle.handleDoubleClick}
      onPointerDown={dragToggle.handlePointerDown}
      onPointerMove={dragToggle.handlePointerMove}
      onPointerUp={dragToggle.handlePointerUp}
      onPointerCancel={dragToggle.handlePointerUp}
      aria-label={activeMenu ? "Close sidebar" : "Open sidebar"}
      aria-expanded={activeMenu}
      className="fixed flex items-center justify-center w-5 h-12 rounded-r-full bg-white/30 dark:bg-white/20 backdrop-blur-md border border-l-0 border-white/30 dark:border-white/10 opacity-40 hover:opacity-100 focus-visible:opacity-100 hover:bg-white/60 dark:hover:bg-white/20 cursor-grab active:cursor-grabbing touch-none select-none transition-[left,background-color,opacity] duration-300 ease-out"
      style={{ left: activeMenu ? SIDEBAR_WIDTH : 0, top: dragToggle.top, zIndex: 1000001 }}
    >
      <span className="relative w-2.5 h-[8px] flex flex-col justify-between">
        <span
          className={`block h-[1.5px] w-full bg-zinc-700 dark:bg-zinc-100 rounded-full origin-center transition-transform duration-300 ease-out ${
            activeMenu ? "translate-y-[3.5px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[1.5px] w-full bg-zinc-700 dark:bg-zinc-100 rounded-full transition-opacity duration-200 ease-out ${
            activeMenu ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          className={`block h-[1.5px] w-full bg-zinc-700 dark:bg-zinc-100 rounded-full origin-center transition-transform duration-300 ease-out ${
            activeMenu ? "-translate-y-[3.5px] -rotate-45" : ""
          }`}
        />
      </span>
    </button>
  );
}
