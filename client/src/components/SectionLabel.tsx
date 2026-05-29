import { clsx } from "clsx";

type SectionLabelProps = {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
};

export function SectionLabel({ eyebrow, title, copy, align = "left" }: SectionLabelProps) {
  return (
    <div className={clsx("section-label", align === "center" && "mx-auto text-center")}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
    </div>
  );
}
