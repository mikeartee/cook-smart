import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const BetaBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <Text style={styles.betaText}>🚧 BETA VERSION</Text>
      <Text style={styles.description}>All features are FREE during BETA testing</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9800',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  betaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});