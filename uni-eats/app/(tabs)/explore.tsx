import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export default function TabTwoScreen() {
  const { t } = useTranslation();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          {t('explore.title')}
        </ThemedText>
      </ThemedView>
      <ThemedText>{t('explore.intro')}</ThemedText>
      <Collapsible title={t('explore.fileRoutingTitle')}>
        <ThemedText>
          {t('explore.fileRoutingBody', {
            homeScreen: 'app/(tabs)/index.tsx',
            exploreScreen: 'app/(tabs)/explore.tsx',
          })}
        </ThemedText>
        <ThemedText>
          {t('explore.fileRoutingLayout', { layoutFile: 'app/(tabs)/_layout.tsx' })}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">{t('explore.learnMore')}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={t('explore.platformSupportTitle')}>
        <ThemedText>
          {t('explore.platformSupportBody', { key: 'w' })}
        </ThemedText>
      </Collapsible>
      <Collapsible title={t('explore.imagesTitle')}>
        <ThemedText>
          {t('explore.imagesBody', { at2x: '@2x', at3x: '@3x' })}
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">{t('explore.learnMore')}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={t('explore.themeTitle')}>
        <ThemedText>
          {t('explore.themeBody', { hook: 'useColorScheme()' })}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">{t('explore.learnMore')}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={t('explore.animationsTitle')}>
        <ThemedText>
          {t('explore.animationsBody', {
            component: 'components/HelloWave.tsx',
            library: 'react-native-reanimated',
          })}
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              {t('explore.parallaxBody', { component: 'components/ParallaxScrollView.tsx' })}
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
