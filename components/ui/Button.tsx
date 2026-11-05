import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "onPhoto";
export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-tertiary",
  danger: "btn-danger",
  onPhoto: "btn-photo",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common> & { href: string; download?: boolean | string };

export type ButtonProps = AsButton | AsLink;

function classes(variant: ButtonVariant, size: ButtonSize, block?: boolean, extra?: string) {
  return ["btn", variantClass[variant], `btn-${size}`, block ? "btn-block" : "", extra ?? ""].filter(Boolean).join(" ");
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function Button(props: ButtonProps) {
  const {
    variant = "secondary",
    size = "md",
    icon,
    iconRight,
    loading,
    loadingLabel,
    block,
    className,
    children,
    ...rest
  } = props;
  const cls = classes(variant, size, block, className);
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {(loading && loadingLabel) || children ? <span>{loading && loadingLabel ? loadingLabel : children}</span> : null}
      {!loading && iconRight}
    </>
  );

  if (typeof rest.href === "string") {
    const { href, download, ...linkRest } = rest as AsLink;
    if (download || href.startsWith("/api/")) {
      return (
        <a href={href} className={cls} download={download === true ? "" : download || undefined} {...(linkRest as ComponentProps<"a">)}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...linkRest}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...btnRest } = rest as AsButton;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...btnRest}>
      {content}
    </button>
  );
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function IconButton({ label, icon, variant = "secondary", size = "md", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={["btn btn-icon", variantClass[variant], `btn-${size}`, className ?? ""].join(" ")}
      {...rest}
    >
      {icon}
    </button>
  );
}
