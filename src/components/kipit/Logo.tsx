type LogoProps = {
  className?: string;
  tone?: "brand" | "light";
};

export function Logo({ className = "", tone = "brand" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-baseline font-extrabold tracking-tight ${
        tone === "light" ? "text-brand-foreground" : "text-brand"
      } ${className}`}
    >
      Kipit
      <span className="ml-0.5 inline-block size-[0.28em] translate-y-[-0.06em] rounded-full bg-gold" />
    </span>
  );
}
