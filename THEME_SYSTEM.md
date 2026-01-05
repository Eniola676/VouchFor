# Global Theme System Documentation

## Overview

The application now uses a centralized, CSS variable-based theme system that supports both dark and light modes. All colors are defined as semantic tokens that automatically switch based on the active theme.

## Theme Structure

### CSS Variables

All theme colors are defined in `src/index.css` using CSS variables:

**Light Theme (default `:root`):**
- `--bg-primary`: White (#ffffff)
- `--bg-secondary`: Light gray (#f9fafb)
- `--bg-tertiary`: Lighter gray (#f3f4f6)
- `--surface`: White (#ffffff)
- `--surface-elevated`: White (#ffffff)
- `--text-primary`: Dark gray (#111827)
- `--text-secondary`: Medium gray (#6b7280)
- `--text-tertiary`: Light gray (#9ca3af)
- `--border`: Light border (#e5e7eb)
- `--border-hover`: Hover border (#d1d5db)
- `--accent`: Orange (#ea580c) - **Consistent across themes**
- `--accent-hover`: Darker orange (#c2410c)

**Dark Theme (`.dark` class):**
- `--bg-primary`: Black (#000000)
- `--bg-secondary`: Near-black (#0a0a0a)
- `--bg-tertiary`: Dark gray (#111111)
- `--surface`: Near-black (#0a0a0a)
- `--surface-elevated`: Dark gray (#1a1a1a)
- `--text-primary`: White (#ffffff)
- `--text-secondary`: Light gray (#9ca3af)
- `--text-tertiary`: Medium gray (#6b7280)
- `--border`: Dark border (#1f2937)
- `--border-hover`: Lighter dark border (#374151)
- `--accent`: Orange (#ea580c) - **Same as light theme**
- `--accent-hover`: Darker orange (#c2410c)

## Usage in Components

### Tailwind Classes

Use semantic color classes in your components:

```tsx
// Backgrounds
<div className="bg-bg-primary">        // Main background
<div className="bg-bg-secondary">      // Secondary background
<div className="bg-surface">          // Surface/card background
<div className="bg-surface-elevated">  // Elevated surface

// Text
<p className="text-text-primary">     // Primary text
<p className="text-text-secondary">  // Secondary text
<p className="text-text-tertiary">    // Tertiary text

// Borders
<div className="border border-border">        // Standard border
<div className="border border-border-hover"> // Hover border

// Accent (Orange)
<button className="bg-accent text-white">    // Accent background
<a className="text-accent">                  // Accent text
<div className="border-accent">               // Accent border
```

### Direct CSS Variable Usage

You can also use CSS variables directly in inline styles or custom CSS:

```css
.custom-element {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border);
}
```

## Theme Toggle

The theme toggle is available in the account dropdown menu (top-right corner). It:
- Switches between dark and light modes instantly
- Persists user preference in localStorage
- Defaults to system preference if no saved setting exists

## Theme Provider

The `ThemeProvider` component (`src/lib/theme-provider.tsx`) manages theme state:
- Applies the `dark` class to the root element when dark mode is active
- Handles system preference detection
- Persists theme choice in localStorage

### Using the Theme Hook

```tsx
import { useTheme } from '@/lib/theme-provider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // theme: 'dark' | 'light' | 'system'
  // setTheme: (theme: 'dark' | 'light' | 'system') => void
  // resolvedTheme: 'dark' | 'light' (actual active theme)
}
```

## Accent Color Rules

**The orange accent color (`#ea580c`) is consistent across both themes** and should be used for:
- Primary buttons
- Links and active states
- Focus indicators
- Hover states on interactive elements
- Brand elements

**Do not introduce additional accent colors.** Use the semantic tokens for all other colors.

## Migration Guide

When updating existing components:

1. **Replace hard-coded colors:**
   - `bg-black` → `bg-bg-primary` (or `bg-surface` for cards)
   - `text-white` → `text-text-primary`
   - `text-gray-400` → `text-text-secondary`
   - `border-gray-800` → `border-border`
   - `bg-primary-600` → `bg-accent`

2. **Remove dark mode classes:**
   - Instead of `dark:bg-black`, use `bg-bg-primary` (automatically switches)
   - Instead of `dark:text-white`, use `text-text-primary`

3. **Use semantic tokens:**
   - Prefer `bg-surface-elevated` over `bg-black/80`
   - Use `text-text-secondary` for muted text
   - Use `border-border` for all borders

## Best Practices

1. **Always use semantic tokens** - Don't hard-code colors
2. **Test in both themes** - Ensure components look good in light and dark mode
3. **Maintain contrast** - Ensure text is readable in both themes
4. **Use accent sparingly** - Reserve orange for important interactive elements
5. **Leverage transitions** - The theme system includes smooth transitions between themes

## Files Modified

- `src/index.css` - CSS variable definitions
- `tailwind.config.js` - Tailwind color configuration
- `src/lib/theme-provider.tsx` - Theme state management
- `src/components/DashboardHeader.tsx` - Updated to use semantic tokens
- `src/components/affiliate/ActivePrograms.tsx` - Updated to use semantic tokens
- `src/pages/dashboard/affiliate/index.tsx` - Updated to use semantic tokens
- `src/components/ui/dropdown-menu.tsx` - Updated to use semantic tokens

## Future Enhancements

- Consider adding more semantic tokens as needed (e.g., `--success`, `--error`, `--warning`)
- Add theme-aware shadows and gradients
- Create theme-aware component variants




