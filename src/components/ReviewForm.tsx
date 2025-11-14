import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { RatingStars } from './RatingStars';

interface Props {
  recipeId: string;
  userId: string;
  existingRating?: number;
  existingReview?: string;
  onSubmit: (rating: number, review: string) => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<Props> = ({
  recipeId,
  userId,
  existingRating = 0,
  existingReview = '',
  onSubmit,
  onCancel
}) => {
  const [rating, setRating] = useState(existingRating);
  const [review, setReview] = useState(existingReview);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    onSubmit(rating, review.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {existingRating > 0 ? 'Update Your Review' : 'Rate This Recipe'}
      </Text>
      
      <View style={styles.ratingSection}>
        <Text style={styles.label}>Your Rating:</Text>
        <RatingStars
          rating={rating}
          onRatingChange={setRating}
          size={32}
        />
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.label}>Your Review (Optional):</Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="Share your thoughts about this recipe..."
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {review.length}/500 characters
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {existingRating > 0 ? 'Update' : 'Submit'} Review
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});