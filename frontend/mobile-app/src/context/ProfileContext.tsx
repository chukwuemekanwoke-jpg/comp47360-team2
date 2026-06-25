import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

export interface UserProfile {
  name: string;
  favoriteCuisines: string[];
  maxPriceLevel: number;
  diningStyle: string;
  radiusKm: number;
}

interface ProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
}

const ProfileContext =
  createContext<ProfileContextType | null>(null);

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfile must be used inside ProfileProvider"
    );
  }

  return context;
}