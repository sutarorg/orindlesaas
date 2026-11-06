import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-normal rounded-full text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-3 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-teal-dark",
        teal: "bg-teal text-white hover:bg-teal-dark",
        secondary: "border border-line bg-white text-ink hover:border-ink/30 hover:bg-soft",
        ghost: "text-ink hover:bg-soft",
        mint: "bg-mint text-ink hover:bg-mint-strong",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "min-h-10 px-4 py-2 text-[13px]",
        lg: "min-h-12 px-6 py-3 text-[15px]",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    const child = React.Children.only(children);
    if (!React.isValidElement<{ className?: string }>(child)) {
      throw new Error("Button asChild requires one valid React element.");
    }

    return React.cloneElement(child, {
      ...props,
      className: cn(classes, child.props.className),
    });
  }

  return <button className={classes} {...props}>{children}</button>;
}

export { Button, buttonVariants };
