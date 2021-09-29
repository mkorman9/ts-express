import type { Moment } from 'moment';

import type { ErrorCause } from '../common/API';
import type { CaptchaAnswer } from '../captcha/CaptchaAPI';

export interface LoginMethod {
  defined: boolean;
}

export interface LoginMethods {
  emailAndPassword: LoginMethod;
  github: LoginMethod;
}

export interface AccountInfo {
  id: string;
  username: string;
  email: string;
  language: string;
  registeredAt: Moment;
  roles: string[];
  isActive: boolean;
  isBanned: boolean;
  bannedUntil: Moment | null;
  loginMethods: LoginMethods;
}

export interface PublicAccountInfo {
  id: string;
  username: string;
  language: string;
  registeredAt: Moment;
  roles: string[];
  isBanned: boolean;
  bannedUntil: Moment | null;
}

export interface LoginMethodResponse {
  defined: boolean;
}

export interface LoginMethodsResponse {
  emailAndPassword: LoginMethodResponse;
  github: LoginMethodResponse;
}

export interface AccountInfoResponse {
  id: string;
  username: string;
  email: string;
  language: string;
  registeredAt: string;
  roles: string[];
  isActive: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  loginMethods: LoginMethodsResponse;
}

export interface PublicAccountInfoResponse {
  id: string;
  username: string;
  language: string;
  registeredAt: string;
  roles: string[];
  isBanned: boolean;
  bannedUntil: string | null;
}

export interface AccountsFilters {
  username?: string;
}

export interface AccountsInfoPage {
  data: AccountInfo[];
  totalPages: number;
}

export interface AccountsInfoPageResponse {
  data: AccountInfoResponse[];
  totalPages: number;
}

export interface EditProfilePayload {
  username?: string;
  email?: string;
  language?: string;
  password?: {
    oldPassword: string;
    newPassword: string;
  };
}

export interface EditProfileStatusResponse {
  username: {
    isModified: boolean;
    causes: ErrorCause[];
    isServerError: boolean;
  };
  email: {
    isModified: boolean;
    causes: ErrorCause[];
    isServerError: boolean;
  };
  language: {
    isModified: boolean;
    causes: ErrorCause[];
    isServerError: boolean;
  };
  password: {
    isModified: boolean;
    causes: ErrorCause[];
    isServerError: boolean;
  };
}

export interface AccountAPIContextType {
  getAccountInfo: () => Promise<AccountInfo>;
  getPublicAccountInfoByUsername: (username: string) => Promise<PublicAccountInfo>;
  getPublicAccountInfoByID: (id: string) => Promise<PublicAccountInfo>;
  activateAccount: (accountId: string) => Promise<void>;
  requestPasswordReset: (email: string, captcha: CaptchaAnswer) => Promise<void>;
  setNewPassword: (password: string, accountId?: string, code?: string) => Promise<void>;
  changeEmail: (accountId: string, code: string) => Promise<void>;
  registerNewAccount: (username: string, email: string, password: string, captcha: CaptchaAnswer) => Promise<void>;
  editProfile: (payload: EditProfilePayload) => Promise<EditProfileStatusResponse>;
}
