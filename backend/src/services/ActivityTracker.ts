import NotificationService from './NotificationService';

interface User {
  id: string;
  name: string;
  email: string;
}

class ActivityTracker {
  /**
   * Track user signup
   */
  async trackSignup(user: User, referralCode?: string, referredBy?: string): Promise<void> {
    try {
      console.log(`📊 Tracking signup for user: ${user.email}`);

      const signupData: any = {
        userName: user.name || 'Unknown User',
        userEmail: user.email,
      };
      
      if (referredBy) signupData.referredBy = referredBy;
      if (referralCode) signupData.referralCode = referralCode;

      await NotificationService.sendActivityNotification('signup', {
        signup: signupData,
      });

      console.log(`✅ Signup notification sent for: ${user.email}`);
    } catch (error) {
      console.error('Failed to track signup:', error);
      // Don't throw - tracking failures shouldn't block signup
    }
  }

  /**
   * Track purchase
   */
  async trackPurchase(
    user: User,
    plan: string,
    amount: number
  ): Promise<void> {
    try {
      console.log(`📊 Tracking purchase for user: ${user.email}`);

      await NotificationService.sendActivityNotification('purchase', {
        purchase: {
          userName: user.name || 'Unknown User',
          userEmail: user.email,
          plan,
          amount,
        },
      });

      console.log(`✅ Purchase notification sent for: ${user.email}`);
    } catch (error) {
      console.error('Failed to track purchase:', error);
      // Don't throw - tracking failures shouldn't block purchase
    }
  }

  /**
   * Track referral
   */
  async trackReferral(
    referrer: User,
    referee: User,
    referralCode: string
  ): Promise<void> {
    try {
      console.log(`📊 Tracking referral: ${referrer.email} → ${referee.email}`);

      await NotificationService.sendActivityNotification('referral', {
        referral: {
          referrerName: referrer.name || 'Unknown User',
          referrerEmail: referrer.email,
          refereeName: referee.name || 'Unknown User',
          refereeEmail: referee.email,
          referralCode,
        },
      });

      console.log(`✅ Referral notification sent`);
    } catch (error) {
      console.error('Failed to track referral:', error);
      // Don't throw - tracking failures shouldn't block referral
    }
  }
}

export default new ActivityTracker();
