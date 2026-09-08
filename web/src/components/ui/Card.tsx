import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  padding?: boolean;
}

export default function Card({
  header,
  padding = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-white rounded-2xl shadow-sm border border-gray-200",
        className,
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-800">
          {header}
        </div>
      )}
      <div className={clsx(padding && "p-5")}>{children}</div>
    </div>
  );
}
