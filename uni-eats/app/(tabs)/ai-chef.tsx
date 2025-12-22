import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AiChefScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">AI Chef</ThemedText>
      <ThemedText>AI Chef screen - Coming soon</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
