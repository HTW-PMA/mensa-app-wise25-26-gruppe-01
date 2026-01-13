import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notifications.title') }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('notifications.title')}</ThemedText>
        <ThemedText>{t('notifications.comingSoon')}</ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
