import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface Props {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showNumber?: boolean;
}

export const RatingStars: React.FC<Props> = ({
  rating,
  onRatingChange,
  size = 24,
  readonly = false,
  showNumber = false
}) => {
  const handleStarPress = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStar = (index: number) => {
    const starRating = index + 1;
    const isFilled = rating >= starRating;
    const isHalfFilled = rating >= starRating - 0.5 && rating < starRating;

    let starIcon = '☆';
    if (isFilled) {
      starIcon = '★';
    } else if (isHalfFilled) {
      starIcon = '⭐';
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.star, { width: size, height: size }]}
        onPress={() => handleStarPress(starRating)}
        disabled={readonly}
      >
        <Text style={[
          styles.starText,
          { fontSize: size },
          isFilled && styles.filledStar,
          isHalfFilled && styles.halfStar
        ]}>
          {starIcon}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
      {showNumber && (
        <Text style={styles.ratingNumber}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  starText: {
    color: '#ddd',
  },
  filledStar: {
    color: '#FFD700',
  },
  halfStar: {
    color: '#FFD700',
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});