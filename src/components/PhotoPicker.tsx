import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PhotoPickerProps {
  onPhotoSelected: (base64: string) => void;
  currentPhoto?: string;
}

export default function PhotoPicker({
  onPhotoSelected,
  currentPhoto,
}: PhotoPickerProps) {
  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (result.assets && result.assets[0].base64) {
      onPhotoSelected(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (result.assets && result.assets[0].base64) {
      onPhotoSelected(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const showOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      {text: 'Take Photo', onPress: handleCamera},
      {text: 'Choose from Gallery', onPress: handleGallery},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  return (
    <View style={styles.container}>
      {currentPhoto ? (
        <TouchableOpacity onPress={showOptions} style={styles.photoContainer}>
          <Image source={{uri: currentPhoto}} style={styles.photo} />
          <View style={styles.editOverlay}>
            <Icon name="edit" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={showOptions} style={styles.addButton}>
          <Icon name="add-a-photo" size={32} color="#FF6B6B" />
          <Text style={styles.addText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  addButton: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  addText: {
    marginTop: 8,
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
});
