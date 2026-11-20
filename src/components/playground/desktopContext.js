import { createContext, useContext } from "react";

export const DesktopContext = createContext(null);
export const WindowFrameContext = createContext(null);

export function useDesktop() {
  const value = useContext(DesktopContext);
  if (!value) throw new Error("SakutaOS settings are only available on the desktop.");
  return value;
}

function noopNotify() {}

export function useNotify() {
  const desktop = useContext(DesktopContext);
  return desktop?.notify || noopNotify;
}

export function useWindowFrame() {
  return useContext(WindowFrameContext);
}
