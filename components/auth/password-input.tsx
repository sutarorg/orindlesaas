"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string };

export function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} className={`pr-12${className ? ` ${className}` : ""}`} {...props} />
      <button
        type="button"
        aria-label={label}
        aria-controls={id}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-0.5 top-0.5 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted outline-none transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"
      >
        {visible ? <EyeOff aria-hidden="true" className="size-4.5" /> : <Eye aria-hidden="true" className="size-4.5" />}
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
