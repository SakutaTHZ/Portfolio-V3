import { createContext, useContext } from "react";

export const DesktopContext = createContext(null);

export function useDesktop() {
  const value = useContext(DesktopContext);
  if (!value) throw new Error("SakutaOS settings are only available on the desktop.");
  return value;
}
