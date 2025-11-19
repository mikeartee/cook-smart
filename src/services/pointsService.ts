import axios from 'axios';
import {API_ENDPOINTS} from '../config/api';
import {getAuthToken} from '../utils/auth';

export interface UserPoints {
  userId: string;
  totalPoints: number;
  level: number;
  lastUpdated: Date;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  action: string;
  description: string;
  dateCreated: Date;
}

export const pointsService = {
  async getUserPoints(): Promise<UserPoints> {
    const token = await getAuthToken();
    const response = await axios.get(API_ENDPOINTS.points.base, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
  },

  async getPointsHistory(
    limit: number = 20,
    offset: number = 0,
  ): Promise<PointsTransaction[]> {
    const token = await getAuthToken();
    const response = await axios.get(API_ENDPOINTS.points.history, {
      headers: {Authorization: `Bearer ${token}`},
      params: {limit, offset},
    });
    return response.data;
  },
};
