import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Share} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import socialService from '../services/socialService';

export default function RecipeSocialActions({recipeId, recipeTitle}: any) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadLikeStatus();
  }, [recipeId]);

  const loadLikeStatus = async () => {
    try {
      const response = await socialService.getLikeStatus(recipeId);
      if (response.success) {
        setIsLiked(response.isLiked);
        setLikesCount(response.likesCount);
      }
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        const response = await socialService.unlikeRecipe(recipeId);
        if (response.success) {
          setIsLiked(false);
          setLikesCount(response.likesCount);
        }
      } else {
        const response = await socialService.likeRecipe(recipeId);
        if (response.success) {
          setIsLiked(true);
          setLikesCount(response.likesCount);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this recipe: ${recipeTitle}`,
        title: recipeTitle,
      });
      await socialService.shareRecipe(recipeId, 'native_share');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
        <Icon
          name={isLiked ? 'favorite' : 'favorite-border'}
          size={24}
          color={isLiked ? '#FF6B6B' : '#666'}
        />
        <Text style={styles.actionText}>{likesCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <Icon name="share" size={24} color="#666" />
        <Text style={styles.actionText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
});
