import { Text, TextProps, StyleSheet } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useMemo } from 'react';

// You might need to load the font in your root layout/app initialization
// properly for 'Lexend' family to be available.

export type ThemedTextProps = TextProps & {
    style?: TextProps['style'];
};

export const ThemedText = ({ style, ...props }: ThemedTextProps) => {
    const { settings, currentUser } = useApp();

    // Fallback to settings if user specific is not set, or migration logic will handle it
    const fontPreference = currentUser?.fontPreference ?? settings.fontPreference ?? (settings.dyslexiaFontEnabled ? 'lexend' : 'standard');

    const logic = useMemo(() => {
        if (fontPreference === 'opendyslexic') {
            return {
                fontFamily: 'OpenDyslexic',
                scale: 0.9, // 10% reduction
                adjustsFontSizeToFit: true,
            };
        } else if (fontPreference === 'lexend') {
            const flattenedStyle = StyleSheet.flatten(style);
            const isBold = flattenedStyle?.fontWeight === 'bold' ||
                flattenedStyle?.fontWeight === '700' ||
                flattenedStyle?.fontWeight === '800' ||
                flattenedStyle?.fontWeight === '900';
            return {
                fontFamily: isBold ? 'Lexend-Bold' : 'Lexend',
                fontWeight: undefined,
                scale: 1,
                adjustsFontSizeToFit: false,
            };
        }
        // Standard
        return {
            fontFamily: undefined,
            scale: 1,
            adjustsFontSizeToFit: false,
        };
    }, [fontPreference, style]);

    const finalStyle = [
        style,
        logic.fontFamily ? { fontFamily: logic.fontFamily } : {},
        logic.fontWeight !== undefined ? { fontWeight: logic.fontWeight as any } : {},
        logic.scale !== 1 && style ? { fontSize: (StyleSheet.flatten(style).fontSize || 16) * logic.scale } : {}
    ];

    return (
        <Text
            adjustsFontSizeToFit={props.adjustsFontSizeToFit ?? logic.adjustsFontSizeToFit}
            minimumFontScale={0.8}
            style={finalStyle}
            {...props}
        />
    );
};
