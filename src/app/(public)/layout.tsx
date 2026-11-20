import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute right-4 top-4 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center font-display text-5xl font-extrabold">
          Fit<span className="text-accent-text">nes</span>
        </div>
        {children}
      </div>
    </div>
  );
}
