// Helper to map canteen names to university logos
// Logos expected under assets/images/uni-logos/

const logoEntries = [
  {
    keywords: ['htw', 'wilhelminenhof', 'treskow', 'treskowallee'],
    logo: require('@/assets/images/uni-logos/htw-logo.png'),
  },
  {
    keywords: ['humboldt', 'hu ', 'adlershof', 'oase'],
    logo: require('@/assets/images/uni-logos/hu-logo.png'),
  },
  {
    keywords: ['freie universität', 'fu ', 'fu-'],
    logo: require('@/assets/images/uni-logos/fu-logo.png'),
  },
  {
    keywords: ['technische universität', 'tu ', 'tu-'],
    logo: require('@/assets/images/uni-logos/tu-logo.png'),
  },
  {
    keywords: ['hwr', 'wirtschaft und recht', 'alt-friedrichsfelde', 'friedrichsfelde'],
    logo: require('@/assets/images/uni-logos/hwr-logo.png'),
  },
  {
    keywords: ['ash', 'alice salomon'],
    logo: require('@/assets/images/uni-logos/ash-logo.png'),
  },
  {
    keywords: ['bht', 'beuth', 'berliner hochschule für technik'],
    logo: require('@/assets/images/uni-logos/bht-logo.png'),
  },
  {
    keywords: ['charité', 'charite'],
    logo: require('@/assets/images/uni-logos/charite-logo.png'),
  },
  {
    keywords: ['ehb', 'evangelische hochschule'],
    logo: require('@/assets/images/uni-logos/ehb-logo.png'),
  },
  {
    keywords: ['hfm', 'musik hanns eisler'],
    logo: require('@/assets/images/uni-logos/hfm-logo.png'),
  },
  {
    keywords: ['hfs', 'ernst busch', 'schauspielkunst'],
    logo: require('@/assets/images/uni-logos/hfs-logo.png'),
  },
  {
    keywords: ['khs', 'kunsthochschule'],
    logo: require('@/assets/images/uni-logos/khs-logo.png'),
  },
  {
    keywords: ['khsb', 'katholische hochschule'],
    logo: require('@/assets/images/uni-logos/khsb-logo.png'),
  },
];

// Fallback: Stock-Image für unbekannte Mensen
const defaultLogo = { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=870&auto=format&fit=crop' };

export const getCanteenLogo = (canteenName: string) => {
  const name = (canteenName || '').toLowerCase();
  for (const entry of logoEntries) {
    if (entry.keywords.some((kw) => name.includes(kw))) {
      return entry.logo;
    }
  }
  return defaultLogo;
};
