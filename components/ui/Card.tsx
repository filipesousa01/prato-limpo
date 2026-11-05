import type { ComponentProps, ReactNode } from "react";

type CardProps = Omit<ComponentProps<"section">, "title" | "ref"> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  as?: "section" | "div" | "article";
};

export function Card({ title, subtitle, actions, children, className, as: Tag = "section", ...rest }: CardProps) {
  return (
    <Tag className={["card", className ?? ""].join(" ")} {...rest}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="caption">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
