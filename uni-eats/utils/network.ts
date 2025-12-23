import NetInfo from '@react-native-community/netinfo';

export const network = {
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Failed to check network status:', error);
      return false;
    }
  },

  subscribe(callback: (isConnected: boolean) => void) {
    return NetInfo.addEventListener((state) => {
      callback(state.isConnected ?? false);
    });
  },
};
