# Referral System Guide - Cook Smart

## 📍 Where to Find It

The referral system is **already built and active** in the app!

### Location: Profile Screen
1. Open the app
2. Tap on **Profile** (bottom navigation)
3. Scroll down - you'll see the **"Refer a Friend"** card

## 🎁 How It Works

### For the Referrer (You/Your Users):
- Each user gets a unique referral code
- Share the code with friends
- When a friend signs up with your code AND purchases a yearly subscription:
  - ✅ You get **1 month free access**
  - ✅ You earn **100 bonus points**

### For the Referee (New User):
- Uses referral code during signup or subscription
- Gets access to the app
- Helps their friend earn rewards

## 📱 Features in the Referral Card

✅ **Your Referral Code** - Displayed prominently  
✅ **Copy Button** - One-tap copy to clipboard  
✅ **Share Button** - Opens native share dialog  
✅ **Stats Display** - Shows months earned and active referrals  
✅ **How It Works** - Clear explanation of the process  

## 🚀 How to Promote It

### 1. Tell Your Beta Testers
"Check out the Refer a Friend section in your Profile! Share your code and earn free months when friends subscribe."

### 2. Social Media Posts
```
🎉 Love Cook Smart? Share it with friends!

Use my referral code: [YOUR_CODE]

When you subscribe to the yearly plan, I get a free month and you get access to 1M+ recipes!

Download: https://cooksmartapp.com
```

### 3. In-App Promotion Ideas
- Add a notification: "Share your referral code and earn free months!"
- Show referral card on home screen occasionally
- Add referral reminder after users cook their 5th recipe

### 4. Email Signature
```
P.S. Try Cook Smart - the recipe app that finds meals from ingredients you have!
Use code [YOUR_CODE] when you subscribe: https://cooksmartapp.com
```

## 💡 Incentive Ideas to Boost Referrals

### Current Rewards:
- 1 month free per yearly subscription referral
- 100 bonus points per successful referral

### Potential Enhancements:
- **Tiered Rewards**: 3 referrals = 6 months free, 5 referrals = lifetime access
- **Leaderboard**: Top referrers get featured
- **Bonus Months**: First 10 referrers get double rewards
- **Special Badge**: "Super Referrer" badge for 5+ referrals

## 🎯 Marketing Copy You Can Use

### Short Version:
"Refer friends to Cook Smart and earn free months! Check your Profile for your unique code."

### Medium Version:
"Love Cook Smart? Share your referral code with friends! When they subscribe to a yearly plan, you get 1 month free + 100 bonus points. Find your code in Profile → Refer a Friend."

### Long Version:
"Help us grow Cook Smart and get rewarded! Every friend who subscribes using your referral code earns you 1 month of free access plus 100 bonus points. Share your unique code from the Profile screen and start earning today!"

## 📊 Tracking Referrals

Users can see their referral stats in the Refer a Friend card:
- **Months Earned** - Total free months accumulated
- **Active Referrals** - Number of friends who subscribed
- **Access Extended Until** - When their free access expires

## 🔧 Technical Details

### Backend Endpoints:
- `POST /api/v1/referrals` - Create/get referral code
- `GET /api/v1/referrals` - Get user's referrals
- `GET /api/v1/referrals/stats` - Get referral statistics
- `GET /api/v1/referrals/access-info` - Get access extension info
- `GET /api/v1/referrals/validate/:code` - Validate a referral code

### Database Tables:
- `referrals` - Stores referral codes and relationships
- `referral_rewards` - Tracks rewards earned
- Integrated with subscription system

## 🎨 Making It More Visible

If users aren't seeing it, consider:

1. **Add to Home Screen**
   - Show referral card on home screen occasionally
   - "Share Cook Smart with friends and earn rewards!"

2. **Add to Settings**
   - Create a dedicated "Referrals" menu item
   - Make it more discoverable

3. **Push Notification**
   - "Did you know? You can earn free months by referring friends!"

4. **After Recipe View**
   - "Loved this recipe? Share Cook Smart with friends!"
   - Show referral code after user views 3+ recipes

## 📈 Success Metrics to Track

- Number of referral codes generated
- Number of successful referrals (signups)
- Number of paid conversions from referrals
- Total months earned by users
- Most active referrers

## 🎁 Beta Tester Incentive

**Special Offer for Beta Testers:**
"As a beta tester, refer 3 friends who subscribe and get **lifetime free access**!"

This creates urgency and rewards your early supporters.

---

**The referral system is ready to go! Just make sure your beta testers know where to find it (Profile screen) and how to use it.**