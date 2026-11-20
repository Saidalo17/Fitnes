import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn(
          "h-12 rounded-sm border-2 bg-surface-2 px-4 text-base text-fg outline-none transition",
          "placeholder:text-muted focus:border-accent",
          error ? "border-danger" : "border-transparent",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-err`} className="text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
});
