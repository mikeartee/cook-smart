import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AdminDashboardScreen} from '../screens/AdminDashboardScreen';
import {AdminUsersScreen} from '../screens/AdminUsersScreen';
import {AdminAnalyticsScreen} from '../screens/AdminAnalyticsScreen';
import {AdminSystemHealthScreen} from '../screens/AdminSystemHealthScreen';
import {SystemGuardianScreen} from '../screens/admin/SystemGuardianScreen';
import {SubscriptionManagementScreen} from '../screens/admin/SubscriptionManagementScreen';
import {FeedbackManagementScreen} from '../screens/admin/FeedbackManagementScreen';
import {ErrorLogsScreen} from '../screens/admin/ErrorLogsScreen';
import {CostTrackingScreen} from '../screens/admin/CostTrackingScreen';
import {ReferralManagementScreen} from '../screens/admin/ReferralManagementScreen';

const Stack = createStackNavigator();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{title: 'Admin Dashboard'}}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{title: 'User Management'}}
      />
      <Stack.Screen
        name="AdminAnalytics"
        component={AdminAnalyticsScreen}
        options={{title: 'Analytics'}}
      />
      <Stack.Screen
        name="AdminSystemHealth"
        component={AdminSystemHealthScreen}
        options={{title: 'System Health'}}
      />
      <Stack.Screen
        name="SystemGuardian"
        component={SystemGuardianScreen}
        options={{title: 'System Guardian'}}
      />
      <Stack.Screen
        name="SubscriptionManagement"
        component={SubscriptionManagementScreen}
        options={{title: 'Subscriptions'}}
      />
      <Stack.Screen
        name="FeedbackManagement"
        component={FeedbackManagementScreen}
        options={{title: 'Feedback'}}
      />
      <Stack.Screen
        name="ErrorLogs"
        component={ErrorLogsScreen}
        options={{title: 'Error Logs'}}
      />
      <Stack.Screen
        name="CostTracking"
        component={CostTrackingScreen}
        options={{title: 'Cost Tracking'}}
      />
      <Stack.Screen
        name="ReferralManagement"
        component={ReferralManagementScreen}
        options={{title: 'Referrals'}}
      />
    </Stack.Navigator>
  );
};
