import React from "react";

export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 overflow-y-auto bg-background pb-20 scrollbar-hide">{children}</div>
);
