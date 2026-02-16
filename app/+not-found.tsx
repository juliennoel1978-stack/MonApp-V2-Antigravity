import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/constants/colors";
import i18n from "@/utils/i18n";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: i18n.t('home.not_found.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t('home.not_found.message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{i18n.t('home.not_found.link')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: AppColors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: AppColors.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: AppColors.primary,
  },
});
