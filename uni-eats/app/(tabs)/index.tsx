import { StyleSheet, ScrollView, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { mensaApi, type Canteen } from '@/services/mensaApi';

export default function HomeScreen() {
  const router = useRouter();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('HomeScreen: Loading canteens...');
    loadCanteens();
  }, []);

  const loadCanteens = async () => {
    try {
      const data = await mensaApi.getCanteens();
      console.log('HomeScreen: Loaded', data.length, 'canteens');
      setCanteens(data);
    } catch (err) {
      console.error('HomeScreen: Error loading canteens', err);
    } finally {
      setLoading(false);
    }
  };

  console.log('HomeScreen: Rendering with', canteens.length, 'canteens');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/Schriftzug.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Mensen werden geladen...</Text>
        </View>
      ) : canteens.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Keine Mensen gefunden</Text>
          <Pressable style={styles.retryButton} onPress={loadCanteens}>
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.mensaList}>
          <Text style={styles.sectionTitle}>Mensen ({canteens.length})</Text>
          {canteens.map((canteen) => (
            <Pressable
              key={canteen.id}
              style={styles.mensaCard}
              onPress={() => router.push(`/mensa-detail?id=${canteen.id}`)}
            >
              <View style={styles.mensaInfo}>
                <Text style={styles.mensaName}>{canteen.name}</Text>
                {canteen.address?.street && (
                  <Text style={styles.mensaAddress}>{canteen.address.street}</Text>
                )}
                {canteen.address?.city && (
                  <Text style={styles.mensaCity}>
                    {canteen.address.zipcode} {canteen.address.city}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 180,
    height: 60,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mensaList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  mensaCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mensaInfo: {
    gap: 6,
  },
  mensaName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mensaAddress: {
    fontSize: 14,
    color: '#666',
  },
  mensaCity: {
    fontSize: 13,
    color: '#999',
  },
});