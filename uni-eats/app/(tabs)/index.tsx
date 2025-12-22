import { Image } from 'expo-image';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.headerContainer}>
        <Image
          source={require('@/assets/images/Schriftzug.png')}
          style={styles.logo}
        />
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedText type="subtitle">Mensas near you</ThemedText>
        <ThemedView style={styles.mensaCard}>
          <ThemedText type="defaultSemiBold">Coming soon...</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingTop: 30,
  },
  logo: {
    height: 60,
    width: 180,
    resizeMode: 'contain',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mensaCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
});
