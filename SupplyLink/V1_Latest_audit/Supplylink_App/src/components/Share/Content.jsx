import React from "react";

const Content = ({ children, className = "" }) => {
  return (
    <div className={`max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

export default Content;
