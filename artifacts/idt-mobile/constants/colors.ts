/**
 * IDT Mobile design tokens — dark theme matching the web app.
 * HSL source from artifacts/idt-management/src/index.css
 */

const colors = {
  light: {
    // Keep same dark palette for both modes (brand decision)
    text: '#F8FAFC',
    tint: '#F5BE2C',

    background: '#111827',    // HSL 222 47% 11%
    foreground: '#F8FAFC',

    card: '#1A2437',          // HSL 222 47% 15%
    cardForeground: '#F8FAFC',

    primary: '#F5BE2C',       // HSL 43 96% 56% — amber
    primaryForeground: '#111827',

    secondary: '#1A2437',
    secondaryForeground: '#F8FAFC',

    muted: '#1A2437',
    mutedForeground: '#8896AA',

    accent: '#283148',
    accentForeground: '#F8FAFC',

    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    border: '#283148',        // HSL 222 47% 22%
    input: '#283148',

    // Semantic status colors
    statusProses: '#F59E0B',
    statusReady: '#10B981',
    statusTerjual: '#3B82F6',
  },
  dark: {
    text: '#F8FAFC',
    tint: '#F5BE2C',
    background: '#111827',
    foreground: '#F8FAFC',
    card: '#1A2437',
    cardForeground: '#F8FAFC',
    primary: '#F5BE2C',
    primaryForeground: '#111827',
    secondary: '#1A2437',
    secondaryForeground: '#F8FAFC',
    muted: '#1A2437',
    mutedForeground: '#8896AA',
    accent: '#283148',
    accentForeground: '#F8FAFC',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    border: '#283148',
    input: '#283148',
    statusProses: '#F59E0B',
    statusReady: '#10B981',
    statusTerjual: '#3B82F6',
  },
  radius: 12,
};

export default colors;
