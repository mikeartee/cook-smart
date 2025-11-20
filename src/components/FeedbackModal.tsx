import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    message: string;
    rating?: number;
    category?: string;
    screenshot?: string;
  }) => Promise<void>;
}

const CATEGORIES = [
  'Bug',
  'Feature Request',
  'General',
  'Improvement',
  'Other',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagePicker = () => {
    Alert.alert('Add Screenshot', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => handleCamera(),
      },
      {
        text: 'Choose from Library',
        onPress: () => handleGallery(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (result.assets && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          setScreenshot(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (result.assets && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          setScreenshot(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(undefined);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        message: message.trim(),
        rating,
        category,
        screenshot,
      });

      // Reset form
      setMessage('');
      setRating(undefined);
      setCategory(undefined);
      setScreenshot(undefined);

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [{text: 'OK', onPress: onClose}],
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit feedback',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setRating(undefined);
    setCategory(undefined);
    setScreenshot(undefined);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Send Feedback</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.label}>
                How would you rate your experience?
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}>
                    <Icon
                      name={rating && rating >= star ? 'star' : 'star-border'}
                      size={36}
                      color={rating && rating >= star ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category (Optional)</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipSelected,
                    ]}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextSelected,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Feedback *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tell us what you think..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            {/* Screenshot */}
            <View style={styles.section}>
              <Text style={styles.label}>Screenshot (Optional)</Text>
              {screenshot ? (
                <View style={styles.screenshotContainer}>
                  <Image
                    source={{uri: screenshot}}
                    style={styles.screenshotImage}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveScreenshot}>
                    <Icon name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addScreenshotButton}
                  onPress={handleImagePicker}>
                  <Icon name="add-photo-alternate" size={32} color="#6B7280" />
                  <Text style={styles.addScreenshotText}>Add Screenshot</Text>
                  <Text style={styles.addScreenshotSubtext}>
                    Help us understand the issue better
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Icon name="info-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Your feedback helps us improve Cook Smart. Thank you for taking
                the time to share your thoughts!
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addScreenshotButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addScreenshotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  addScreenshotSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  screenshotContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  screenshotImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
