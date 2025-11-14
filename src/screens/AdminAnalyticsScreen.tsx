import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface AnalyticsData {
  userGrowth: { date: string; users: number }[];
  subscriptionMetrics: {
    totalRevenue: number;
    monthlyRecurring: number;
    churnRate: number;
    conversionRate: number;
  };
  betaMetrics: {
    totalBetaUsers: number;
    averageRating: number;
    feedbackCount: number;
    prePurchases: number;
  };
}

export const AdminAnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      // Mock analytics data - replace with actual API
      const mockAnalytics: AnalyticsData = {
        userGrowth: [
          { date: '2024-01-01', users: 100 },
          { date: '2024-01-08', users: 250 },
          { date: '2024-01-15', users: 500 },
          { date: '2024-01-22', users: 850 },
          { date: '2024-01-29', users: 1247 }
        ],
        subscriptionMetrics: {
          totalRevenue: 2199,
          monthlyRecurring: 623,
          churnRate: 2.1,
          conversionRate: 7.2
        },
        betaMetrics: {
          totalBetaUsers: 1158,
          averageRating: 4.8,
          feedbackCount: 342,
          prePurchases: 89
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, color }: any) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centerContainer}>
        <Text>Failed to load analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Business metrics and insights</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Growth</Text>
        <View style={styles.growthChart}>
          {analytics.userGrowth.map((point, index) => (
            <View key={index} style={styles.growthPoint}>
              <Text style={styles.growthDate}>
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.growthUsers}>{point.users}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Revenue"
            value={`$${(analytics.subscriptionMetrics.totalRevenue / 100).toFixed(2)}`}
            subtitle="All time"
            color="#4CAF50"
          />
          <MetricCard
            title="Monthly Recurring"
            value={`$${(analytics.subscriptionMetrics.monthlyRecurring / 100).toFixed(2)}`}
            subtitle="MRR"
            color="#2196F3"
          />
          <MetricCard
            title="Churn Rate"
            value={`${analytics.subscriptionMetrics.churnRate}%`}
            subtitle="Monthly"
            color="#FF9800"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${analytics.subscriptionMetrics.conversionRate}%`}
            subtitle="BETA to paid"
            color="#9C27B0"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BETA Program</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="BETA Users"
            value={analytics.betaMetrics.totalBetaUsers.toLocaleString()}
            subtitle="Active testers"
            color="#FF9800"
          />
          <MetricCard
            title="Average Rating"
            value={`${analytics.betaMetrics.averageRating}/5`}
            subtitle="User satisfaction"
            color="#4CAF50"
          />
          <MetricCard
            title="Feedback Items"
            value={analytics.betaMetrics.feedbackCount}
            subtitle="Total submissions"
            color="#2196F3"
          />
          <MetricCard
            title="Pre-Purchases"
            value={analytics.betaMetrics.prePurchases}
            subtitle="Early adopters"
            color="#9C27B0"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <View style={styles.insightsList}>
          <Text style={styles.insight}>
            📈 User growth is accelerating with 23 new signups today
          </Text>
          <Text style={styles.insight}>
            💰 Pre-purchase conversion rate is 7.7% - exceeding target
          </Text>
          <Text style={styles.insight}>
            ⭐ BETA satisfaction is high at 4.8/5 average rating
          </Text>
          <Text style={styles.insight}>
            🔄 Monthly churn rate is low at 2.1% - healthy retention
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
  growthChart: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  growthPoint: {
    alignItems: 'center',
  },
  growthDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  growthUsers: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  insightsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  insight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
});