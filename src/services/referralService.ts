import axios from 'axios';
import {API_ENDPOINTS} from '../config/api';
import {getAuthToken} from '../utils/auth';

export interface Referral {
  id: string;
  referralCode: string;
  email?: string;
  status: 'pending' | 'completed' | 'expired';
  pointsAwarded: number;
  subscriptionPurchased: boolean;
  subscriptionType?: string;
  accessMonthsAwarded: number;
  dateCreated: Date;
  dateCompleted?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
}

export interface ReferralAccessInfo {
  totalMonthsEarned: number;
  accessExtendedUntil: Date | null;
  activeReferrals: number;
}

export const referralService = {
  async createReferral(email?: string): Promise<string> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_ENDPOINTS.referrals.base}`,
      {email},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );
    return response.data.referralCode;
  },

  async getUserReferrals(): Promise<Referral[]> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_ENDPOINTS.referrals.base}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
  },

  async getReferralStats(): Promise<ReferralStats> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_ENDPOINTS.referrals.stats}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
  },

  async getReferralAccessInfo(): Promise<ReferralAccessInfo> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_ENDPOINTS.referrals.accessInfo}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
  },

  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.referrals.validate}/${code}`,
      );
      return response.data.valid;
    } catch {
      return false;
    }
  },
};
