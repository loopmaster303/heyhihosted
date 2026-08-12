import React from 'react';

/**
 * Renders parameter controls inline. Mobile callers render inside the unified
 * mobile drawer, which is the only drawer allowed to own configuration controls.
 */
export const InlineParamsContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <div className="flex items-center min-w-0 md:overflow-x-auto no-scrollbar">{children}</div>;
};
