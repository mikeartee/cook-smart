import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface PrePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPrePurchase: () => void;
}

export const PrePurchaseModal: React.FC<PrePurchaseModalProps> = ({
  visible,
  onClose,
  onPrePurchase
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Special Offer!</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>30% OFF</Text>
            </View>
            
            <Text style={styles.description}>
              Love Cook Smart? Pre-purchase now and save $10.00 on the yearly plan!
            </Text>
            
            <View style={styles.benefits}>
              <Text style={styles.benefit}>✓ Keep using BETA for FREE until launch</Text>
              <Text style={styles.benefit}>✓ Lock in the lowest price ever</Text>
              <Text style={styles.benefit}>✓ Early access to new features</Text>
              <Text style={styles.benefit}>✓ Support app development</Text>
            </View>
            
            <View style={styles.pricing}>
              <Text style={styles.originalPrice}>Regular: $34.99/year</Text>
              <Text style={styles.salePrice}>Pre-Purchase: $24.99/year</Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterText}>Maybe Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.purchaseButton} onPress={onPrePurchase}>
              <Text style={styles.purchaseText}>Pre-Purchase Now</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#999',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  offerBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  offerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  benefit: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 6,
  },
  pricing: {
    alignItems: 'center',
    marginBottom: 10,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  salePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  laterButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  laterText: {
    color: '#666',
    fontWeight: '600',
  },
  purchaseButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    alignItems: 'center',
  },
  purchaseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});