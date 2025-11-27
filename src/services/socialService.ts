import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';

const API_URL = `${API_BASE_URL}/api/v1`;

class SocialService {
  private async getAuthHeader() {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async followUser(userId: number) {
    const response = await fetch(`${API_URL}/social/follow/${userId}`, {
      method: 'POST',
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async unfollowUser(userId: number) {
    const response = await fetch(`${API_URL}/social/follow/${userId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async getFollowers(userId: number) {
    const response = await fetch(`${API_URL}/social/followers/${userId}`, {
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async getFollowing(userId: number) {
    const response = await fetch(`${API_URL}/social/following/${userId}`, {
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async isFollowing(userId: number) {
    const response = await fetch(`${API_URL}/social/is-following/${userId}`, {
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async addComment(recipeId: string, comment: string, parentId?: number) {
    const response = await fetch(`${API_URL}/social/comments/${recipeId}`, {
      method: 'POST',
      headers: await this.getAuthHeader(),
      body: JSON.stringify({comment, parentId}),
    });
    return response.json();
  }

  async getComments(recipeId: string) {
    const response = await fetch(`${API_URL}/social/comments/${recipeId}`);
    return response.json();
  }

  async deleteComment(commentId: number) {
    const response = await fetch(`${API_URL}/social/comments/${commentId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async likeRecipe(recipeId: string) {
    const response = await fetch(`${API_URL}/social/likes/${recipeId}`, {
      method: 'POST',
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async unlikeRecipe(recipeId: string) {
    const response = await fetch(`${API_URL}/social/likes/${recipeId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async getLikeStatus(recipeId: string) {
    const response = await fetch(`${API_URL}/social/likes/${recipeId}`, {
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async shareRecipe(recipeId: string, platform: string) {
    const response = await fetch(`${API_URL}/social/shares/${recipeId}`, {
      method: 'POST',
      headers: await this.getAuthHeader(),
      body: JSON.stringify({platform}),
    });
    return response.json();
  }

  async getCommunityFeed(limit = 50) {
    const response = await fetch(`${API_URL}/social/feed?limit=${limit}`, {
      headers: await this.getAuthHeader(),
    });
    return response.json();
  }

  async getTrendingRecipes(limit = 20) {
    const response = await fetch(`${API_URL}/social/trending?limit=${limit}`);
    return response.json();
  }
}

export default new SocialService();
