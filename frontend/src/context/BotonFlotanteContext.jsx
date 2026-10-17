/** @format */

import { createContext, useContext, useState } from "react";

const FloatingButtonContext = createContext();

export function FloatingButtonProvider({ children }) {
  const [floatingAction, setFloatingAction] = useState(null); 

  return (
    <FloatingButtonContext.Provider value={{ floatingAction, setFloatingAction }}>
      {children}
    </FloatingButtonContext.Provider>
  );
}

export function useFloatingButton() {
  return useContext(FloatingButtonContext);
}
