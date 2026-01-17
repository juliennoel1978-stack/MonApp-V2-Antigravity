import { useWindowDimensions } from 'react-native';

/**
 * Custom hook for responsive design across all iOS devices.
 * 
 * Breakpoints:
 * - Small screen: height < 700px (iPhone SE, iPhone 8)
 * - Tablet: width > 500px (iPad)
 * 
 * Usage:
 * const { isSmallScreen, isTablet, spacing, fontSize } = useResponsive();
 */

interface ResponsiveValues {
    // Screen detection
    isSmallScreen: boolean;    // iPhone SE, iPhone 8
    isTablet: boolean;         // iPad

    // Dimensions
    width: number;
    height: number;

    // Dynamic spacing function - reduces on small screens
    spacing: (base: number) => number;

    // Dynamic font size function - increases on tablets
    fontSize: (base: number) => number;

    // Common responsive values
    containerMaxWidth: number;
    gridGap: number;
    buttonPadding: number;
}

export const useResponsive = (): ResponsiveValues => {
    const { width, height } = useWindowDimensions();

    // Breakpoints
    const isSmallScreen = height < 700;
    const isTablet = width > 500;

    /**
     * Dynamic spacing function
     * Reduces spacing by 25% on small screens
     * Increases spacing by 15% on tablets
     */
    const spacing = (base: number): number => {
        if (isSmallScreen) {
            return Math.round(base * 0.75);
        }
        if (isTablet) {
            return Math.round(base * 1.15);
        }
        return base;
    };

    /**
     * Dynamic font size function
     * Keeps font size on small screens (adjustsFontSizeToFit handles shrinking)
     * Increases font size by 15% on tablets for better readability
     */
    const fontSize = (base: number): number => {
        if (isTablet) {
            return Math.round(base * 1.15);
        }
        return base;
    };

    // Common responsive values
    const containerMaxWidth = isTablet ? 600 : 500;
    const gridGap = spacing(12);
    const buttonPadding = spacing(16);

    return {
        isSmallScreen,
        isTablet,
        width,
        height,
        spacing,
        fontSize,
        containerMaxWidth,
        gridGap,
        buttonPadding,
    };
};

/**
 * Helper constants for responsive design
 */
export const RESPONSIVE_BREAKPOINTS = {
    SMALL_SCREEN_HEIGHT: 700,
    TABLET_WIDTH: 500,
    MAX_CONTENT_WIDTH: 600,
} as const;
