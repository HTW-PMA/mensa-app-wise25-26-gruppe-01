import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack } from 'expo-router';

export default function NotificationsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Notifications</ThemedText>
        <ThemedText>Notifications screen - Coming soon</ThemedText>
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
