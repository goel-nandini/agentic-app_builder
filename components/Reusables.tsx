import { ReactNode } from "react";

export const GrayTitle = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <span className={`text-white/90 ${className}`}>{children}</span>;
};

export const BlueTitle = ({
  children,
  childern,
  className = "",
}: {
  children?: ReactNode;
  childern?: ReactNode;
  className?: string;
}) => {
  const content = children ?? childern;
  return (
    <span
      className={`bg-gradient-to-br font-serif from-blue-300 via-blue-400 to-blue-600 bg-clip-text text-transparent ${className}`}
    >
      {content}
    </span>
  );
};

export const SectionHeading = ({
  gray,
  blue,
  className = "",
}: {
  gray: string;
  blue: string;
  className?: string;
}) => {
  return (
    <h2
      className={`font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight ${className}`}
    >
      <GrayTitle>{gray}</GrayTitle> <BlueTitle>{blue}</BlueTitle>
    </h2>
  );
};

export const sectionHeading = SectionHeading;