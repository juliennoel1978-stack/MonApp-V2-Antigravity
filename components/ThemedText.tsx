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

    const isDyslexiaFontEnabled = currentUser?.dyslexiaFontEnabled ?? settings.dyslexiaFontEnabled ?? false;

    const fontFamilyStyle = useMemo(() => {
        if (isDyslexiaFontEnabled) {
            // Assuming 'Lexend' is the loaded font name or variant you want
            return { fontFamily: 'Lexend' };
        }
        return {};
    }, [isDyslexiaFontEnabled]);

    return (
        <Text
            // Safe layout enforcement for dyslexic font which might be wider
            adjustsFontSizeToFit={isDyslexiaFontEnabled}
            minimumFontScale={0.8}
            style={[style, fontFamilyStyle]}
            {...props}
        />
    );
};
