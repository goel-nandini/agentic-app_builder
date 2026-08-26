export const GrayTitle = ({ children }: { children: React.ReactNode }) => (
  <span className="text-white font-bold">{children}</span>
);

export const BlueTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </span>
);

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-[0.14em] uppercase mb-4">
    <span className="w-4 h-px bg-gradient-to-r from-transparent to-cyan-400" />
    {children}
    <span className="w-4 h-px bg-gradient-to-l from-transparent to-cyan-400" />
  </p>
);

export const SectionHeading = ({
  gray,
  blue,
}: {
  gray: string;
  blue: string;
}) => (
  <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-tight">
    <GrayTitle>{gray}</GrayTitle>
    <br />
    <BlueTitle>{blue}</BlueTitle>
  </h2>
);