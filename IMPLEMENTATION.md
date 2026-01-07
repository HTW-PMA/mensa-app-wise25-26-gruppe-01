## State Management & Caching Implementierung

### Installierte Dependencies
- `@tanstack/react-query`: Query management und Caching
- `@react-native-async-storage/async-storage`: Persistenter Storage
- `@react-native-community/netinfo`: Netzwerkerkennung

### Erstellte Dateien

#### 1. React Query Konfiguration
**[config/queryClient.ts](config/queryClient.ts)**
- QueryClient mit Defaults konfiguriert
- staleTime: 10 Minuten
- gcTime: 24 Stunden
- Retry Policy: 1 Versuch

#### 2. Query Keys
**[utils/queryKeys.ts](utils/queryKeys.ts)**
- Zentrale, typsichere Query Key Definitionen
- Strukturiert für Mensas und Meals
- Ermöglicht einfaches Invalidieren und Refetching

#### 3. AsyncStorage Wrapper
**[utils/storage.ts](utils/storage.ts)**
- `save<T>()`: Speichert Daten persistent
- `get<T>()`: Liest gecachte Daten
- `remove()`: Löscht einzelne Einträge
- `clear()`: Leert gesamten Cache
- Errors werden logged, nicht geworfen

#### 4. Netzwerk-Detektion
**[utils/network.ts](utils/network.ts)**
- `isConnected()`: Aktuelle Verbindungsstatus
- `subscribe()`: Listener für Änderungen
- Fallback auf `false` bei Errors

#### 5. Hooks mit Caching

**[hooks/useMensas.ts](hooks/useMensas.ts)**
- Fetcht Mensenliste mit Caching
- Offline-Fallback auf gecachte Daten
- Gibt klare States zurück: `isLoading`, `isError`, `isOffline`, `isCached`

**[hooks/useMeals.ts](hooks/useMeals.ts)**
- Fetcht Meals mit optional Filtern (canteenId, date)
- Async Storage Integration für Offline-Support
- Gleiches State-Pattern wie useMensas

#### 6. App.tsx Integration
**[app/_layout.tsx](app/_layout.tsx)**
- QueryClientProvider wraps die gesamte App
- Kein Screen-Code hinzugefügt
- Provider Setup nur

### State Management Pattern

Alle Hooks geben folgende `State` zurück:
```typescript
{
  data: T | null,           // Die eigentlichen Daten
  isLoading: boolean,       // Initial Loading
  isError: boolean,         // Fehler (außer OFFLINE_NO_CACHE)
  error: Error | null,      // Error-Objekt
  isOffline: boolean,       // Offline Modus (mit Cache)
  isCached: boolean         // Daten stammen aus Cache
}
```

### Offline Logik

1. **Online verfügbar**: Fetch via API, speichere in AsyncStorage
2. **Offline mit Cache**: Nutze gecachte Daten, setze `isOffline: true`
3. **Offline ohne Cache**: Throw Error mit Message `'OFFLINE_NO_CACHE'`
4. **API Error mit Cache**: Fallback auf Cache statt Error zu werfen

### Usage in Components

```typescript
import { useMensas, MensasState } from '@/hooks/useMensas';
import { useMeals, MealsState } from '@/hooks/useMeals';

function MyComponent() {
  const mensas = useMensas();
  const meals = useMeals({ canteenId: 'xyz', date: '2025-01-01' });

  if (mensas.isLoading) return <LoadingScreen />;
  if (mensas.isError) return <ErrorScreen error={mensas.error} />;
  if (mensas.isOffline && !mensas.isCached) return <OfflineScreen />;
  
  return <MensasList data={mensas.data} isCached={mensas.isCached} />;
}
```

### Notes

- **kein UI Code**: Nur State Management und Caching Logik
- **typsicher**: Alle Types definiert (MensasState, MealsState)
- **pragmatisch**: OFFLINE_NO_CACHE als Error-Kennzeichnung statt extra Flag
- **wartbar**: Zentrale Konfiguration, wiederverwendbare Utilities
- **Kommentare**: Nur wo Logik nicht trivial
