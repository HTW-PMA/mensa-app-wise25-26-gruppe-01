import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { storage } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

export type ProfileStatus = 'student' | 'employee' | 'guest';
export type DietType = 'none' | 'vegetarian' | 'vegan' | 'pescatarian';

export interface UserProfile {
  allergies: string[];
  dietType: DietType;
  status: ProfileStatus;
  universityId?: string;
  universityName?: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  saveProfile: (nextProfile: UserProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const getProfileKey = (userId: string) => `user_profile_${userId}`;

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const saved = await storage.get<UserProfile>(getProfileKey(user.id));
      if (isMounted) {
        setProfile(saved);
        setIsLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const saveProfile = async (nextProfile: UserProfile) => {
    if (!user) return;
    await storage.save(getProfileKey(user.id), nextProfile);
    setProfile(nextProfile);
  };

  const clearProfile = async () => {
    if (!user) return;
    await storage.remove(getProfileKey(user.id));
    setProfile(null);
  };

  const isProfileComplete = useMemo(() => {
    if (!profile?.status) return false;
    const requiresUniversity = profile.status === 'student' || profile.status === 'employee';
    if (requiresUniversity && !profile.universityId) return false;
    return true;
  }, [profile]);

  const value: ProfileContextType = {
    profile,
    isLoading,
    isProfileComplete,
    saveProfile,
    clearProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
