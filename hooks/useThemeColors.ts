import { useApp } from '@/contexts/AppContext';
import { AppColors, DarkAppColors, GradientColors, DarkGradientColors } from '@/constants/colors';

/**
 * Hook that returns the correct color palette based on the dark mode setting.
 * Respects per-user override: currentUser?.darkMode ?? settings.darkMode
 */
export function useThemeColors() {
    const { settings, currentUser } = useApp();
    const isDark = (currentUser?.darkMode ?? settings.darkMode) || false;
    return isDark ? DarkAppColors : AppColors;
}

/**
 * Returns true if dark mode is active (respects per-user override).
 */
export function useIsDarkMode() {
    const { settings, currentUser } = useApp();
    return (currentUser?.darkMode ?? settings.darkMode) || false;
}

/**
 * Hook that returns the correct gradient colors based on the dark mode setting.
 */
export function useThemeGradients() {
    const { settings, currentUser } = useApp();
    const isDark = (currentUser?.darkMode ?? settings.darkMode) || false;
    return isDark ? DarkGradientColors : GradientColors;
}
