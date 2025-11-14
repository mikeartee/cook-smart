import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { performanceMonitor, PerformanceReport, PerformanceMetric } from '../utils/performanceMonitor';

export const PerformanceScreen: React.FC = () => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);

  const loadPerformanceData = () => {
    // Generate mock data for BETA testing
    performanceMonitor.generateMockData();
    const newReport = performanceMonitor.generateReport();
    setReport(newReport);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPerformanceData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const MetricCard = ({ title, metrics, color }: { title: string; metrics: PerformanceMetric[]; color: string }) => {
    if (metrics.length === 0) return null;

    const avgValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    const unit = metrics[0]?.unit || '';

    return (
      <View style={[styles.metricCard, { borderLeftColor: color }]}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={[styles.metricValue, { color }]}>
          {avgValue.toFixed(1)}{unit}
        </Text>
        <Text style={styles.metricCount}>{metrics.length} samples</Text>
      </View>
    );
  };

  const OptimizationTip = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <View style={styles.tipCard}>
      <Text style={styles.tipIcon}>{icon}</Text>
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipDescription}>{description}</Text>
      </View>
    </View>
  );

  useEffect(() => {
    loadPerformanceData();
    
    // Auto-refresh every 30 seconds when monitoring
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadPerformanceData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  if (!report) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading performance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Performance Monitor</Text>
        <TouchableOpacity
          style={[styles.monitorButton, { backgroundColor: isMonitoring ? '#4CAF50' : '#666' }]}
          onPress={() => setIsMonitoring(!isMonitoring)}
        >
          <Text style={styles.monitorButtonText}>
            {isMonitoring ? '● LIVE' : '○ PAUSED'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Performance</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(report.overallScore) }]}>
            {report.overallScore}
          </Text>
          <Text style={[styles.scoreGrade, { color: getScoreColor(report.overallScore) }]}>
            {getScoreLabel(report.overallScore)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.keyMetricCard}>
            <Text style={styles.keyMetricLabel}>App Load Time</Text>
            <Text style={[
              styles.keyMetricValue,
              { color: report.appLoadTime > 3000 ? '#F44336' : '#4CAF50' }
            ]}>
              {report.appLoadTime}ms
            </Text>
          </View>
          
          <View style={styles.keyMetricCard}>
            <Text style={styles.keyMetricLabel}>Memory Usage</Text>
            <Text style={[
              styles.keyMetricValue,
              { color: report.memoryUsage.length > 0 && report.memoryUsage[0].value > 100 ? '#F44336' : '#4CAF50' }
            ]}>
              {report.memoryUsage.length > 0 ? `${report.memoryUsage[0].value}MB` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Metrics</Text>
        <MetricCard
          title="Screen Transitions"
          metrics={report.screenTransitions}
          color="#2196F3"
        />
        <MetricCard
          title="Network Requests"
          metrics={report.networkRequests}
          color="#FF9800"
        />
        <MetricCard
          title="User Interactions"
          metrics={report.userInteractions}
          color="#9C27B0"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimization Tips</Text>
        <OptimizationTip
          icon="🚀"
          title="App Launch"
          description="Consider lazy loading non-critical components to improve startup time"
        />
        <OptimizationTip
          icon="🖼️"
          title="Image Optimization"
          description="Use optimized image formats and appropriate sizes for better performance"
        />
        <OptimizationTip
          icon="📡"
          title="Network Efficiency"
          description="Implement request caching and minimize API calls where possible"
        />
        <OptimizationTip
          icon="🧠"
          title="Memory Management"
          description="Monitor memory usage and clean up unused resources regularly"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BETA Performance Notes</Text>
        <View style={styles.betaInfo}>
          <Text style={styles.betaText}>
            • Performance monitoring is active during BETA testing{'\n'}
            • Data helps optimize the app before full launch{'\n'}
            • Some metrics may vary based on device capabilities{'\n'}
            • Report issues through the feedback system
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  monitorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  monitorButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreSection: {
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  keyMetricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  keyMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  keyMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricCount: {
    fontSize: 12,
    color: '#999',
  },
  tipCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  betaInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
  },
  betaText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});