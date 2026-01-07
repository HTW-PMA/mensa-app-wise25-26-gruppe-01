# UniEats - Mensa App WiSe25/26

A React Native Expo app for discovering meals and checking mensa (canteen) information at the university.

## Features

- **Search Tab** - Search for meals and mensas with real-time filtering
  - Recent Searches - Save and quickly access your previous searches
  - Popular Search Tags - Quick access to common meal categories (Vegan, Pasta, Pizza, etc.)
  - Persistent Storage - Your search history is saved locally
  - Dark/Light Mode Support

- **Home Tab** - Overview of available mensas and today's meals
- **Map Tab** - Find mensas near you with location-based services
- **AI Chef Tab** - Get personalized meal recommendations
- **Account Tab** - Manage your preferences and settings

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── search.tsx     # Search screen
│   │   ├── index.tsx      # Home screen
│   │   ├── map.tsx        # Map screen
│   │   └── ...
│   └── _layout.tsx        # Root layout
├── components/            # Reusable React components
│   ├── SearchBar.tsx      # Search input component
│   ├── MensaCard.tsx      # Mensa display card
│   └── themed-*.tsx       # Themed UI components
├── hooks/                 # Custom React hooks
│   ├── useSearch.ts       # Search logic and state
│   ├── useMeals.ts        # Meals data fetching
│   ├── useMensas.ts       # Mensas data fetching
│   └── ...
├── services/              # API integration
│   └── mensaApi.ts        # Mensa API client
├── utils/                 # Utility functions
│   ├── searchHelpers.ts   # Search filtering & helpers
│   ├── storage.ts         # AsyncStorage wrapper
│   └── queryKeys.ts       # React Query keys
└── constants/             # App constants
    └── theme.ts           # Color & styling constants
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file with your API key:

   ```
   EXPO_PUBLIC_MENSA_API_KEY=your_api_key_here
   ```

3. Start the app

   ```bash
   npx expo start
   ```

## Search Feature Implementation

### useSearch Hook (`hooks/useSearch.ts`)
- Manages search state and logic
- Integrates with React Query for data fetching
- Provides recent searches functionality
- Handles debounced search filtering

### SearchBar Component (`components/SearchBar.tsx`)
- Reusable search input with clear button
- Themed text colors for light/dark mode
- Integrated search icon from Ionicons

### Search Helpers (`utils/searchHelpers.ts`)
- `filterMeals()` - Filter meals by query
- `filterCanteens()` - Filter mensas by query
- `combineSearchResults()` - Merge and sort results
- `debounce()` - Optimize search performance
- `POPULAR_SEARCHES` - Predefined meal categories

### Search Screen (`app/(tabs)/search.tsx`)
- Recent Searches section with delete functionality
- Popular Searches section with category tags
- Dynamic search results with meal and mensa listings
- Loading states and error handling
- Pull-to-refresh functionality
- Dark/Light mode support

## Technologies

- **React Native** - Cross-platform mobile framework
- **Expo** - React Native development platform
- **TypeScript** - Type-safe JavaScript
- **React Query** - Data fetching and caching
- **Expo Router** - File-based navigation
- **AsyncStorage** - Local data persistence
- **Ionicons** - Icon library

## Requirements

✅ Real-time meal and mensa search
✅ Recent searches saved persistently (max 10)
✅ Popular search categories for quick access
✅ Debounced API calls for performance
✅ Dark/Light mode support
✅ Offline support with caching
✅ Loading and error states
✅ Responsive design

## Learn more

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals
- [React Query docs](https://tanstack.com/query/latest): Data fetching
- [Expo Router](https://docs.expo.dev/router/introduction/): Navigation

## Join the community

- [Expo Discord](https://chat.expo.dev): Chat with developers
- [GitHub](https://github.com/expo/expo): Contribute and explore

