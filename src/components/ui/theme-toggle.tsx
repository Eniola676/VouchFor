import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full border transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        resolvedTheme === "dark"
          ? "bg-accent border-accent-hover"
          : "bg-gray-200 border-gray-300"
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          "absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200",
          resolvedTheme === "dark" ? "translate-x-7" : "translate-x-0"
        )}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 text-gray-900" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </span>
    </button>
  )
}

