import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type IUserPreferences = {
  language: 'ar' | 'en';
  currency: 'SYP' | 'USD' | 'EUR';
};

export type IRecentSearch = {
  term: string;
  searchedAt: Date;
};

export type IUser = {
  name: string;
  role: USER_ROLES;
  phone?: string;
  countryCode?: string;
  email?: string;
  password?: string;
  image?: string;
  dob?: Date;
  isDeleted: boolean;
  status: 'active' | 'blocked';
  verified: boolean;
  preferences: IUserPreferences;
  recentSearches: IRecentSearch[];
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number | null;
    expireAt: Date | null;
    pendingEmail?: string;
    emailChangeOtp?: number | null;
    emailChangeExpireAt?: Date | null;
  };
};

export type UserModel = {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isExistUserByPhone(phone: string): Promise<IUser | null>;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
