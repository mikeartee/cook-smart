'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', {enumerable: true, value: v});
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.PushNotificationService = void 0;
const database_1 = require('../config/database');
const admin = __importStar(require('firebase-admin'));
let firebaseInitialized = false;
function initializeFirebase() {
  if (firebaseInitialized) {
    return;
  }
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      console.warn(
        '⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not set - push notifications disabled',
      );
      return;
    }
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}
initializeFirebase();
class PushNotificationService {
  static registerToken(userId, token, platform) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        yield database_1.default.query(
          `INSERT INTO push_notification_tokens (user_id, token, platform, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, token) 
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
          [userId, token, platform],
        );
        console.log(`✅ Registered FCM token for user ${userId}`);
      } catch (error) {
        console.error('Error registering push token:', error);
      }
    });
  }
  static sendNotification(userId, title, body, data) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!firebaseInitialized) {
        console.warn('Firebase not initialized - skipping notification');
        return;
      }
      try {
        const prefs = yield database_1.default.query(
          'SELECT * FROM notification_preferences WHERE user_id = $1',
          [userId],
        );
        if (prefs.rows.length === 0 || !prefs.rows[0].daily_reminders) {
          return;
        }
        const tokens = yield database_1.default.query(
          'SELECT token, platform FROM push_notification_tokens WHERE user_id = $1',
          [userId],
        );
        if (tokens.rows.length === 0) {
          console.log(`No FCM tokens found for user ${userId}`);
          return;
        }
        const sendPromises = tokens.rows.map(row =>
          this.sendFCMNotification(row.token, row.platform, title, body, data),
        );
        yield Promise.all(sendPromises);
        yield database_1.default.query(
          `INSERT INTO notification_history (user_id, notification_type, title, body)
         VALUES ($1, $2, $3, $4)`,
          [
            userId,
            (data === null || data === void 0 ? void 0 : data.type) ||
              'general',
            title,
            body,
          ],
        );
        console.log(`✅ Sent notification to user ${userId}: ${title}`);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    });
  }
  static sendFCMNotification(token, platform, title, body, data) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const message = {
          token,
          notification: {
            title,
            body,
          },
          data: data ? JSON.parse(JSON.stringify(data)) : {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        };
        const response = yield admin.messaging().send(message);
        console.log(`✅ FCM notification sent successfully: ${response}`);
      } catch (error) {
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          console.log(`🗑️  Removing invalid token: ${token}`);
          yield this.removeInvalidToken(token);
        } else {
          console.error('Error sending FCM notification:', error);
        }
      }
    });
  }
  static removeInvalidToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        yield database_1.default.query(
          'DELETE FROM push_notification_tokens WHERE token = $1',
          [token],
        );
      } catch (error) {
        console.error('Error removing invalid token:', error);
      }
    });
  }
  static sendExpiryAlert(userId, expiringCount) {
    return __awaiter(this, void 0, void 0, function* () {
      const title = '⏰ Ingredients Expiring Soon!';
      const body = `${expiringCount} ingredient${expiringCount > 1 ? 's' : ''} expiring in the next 3 days`;
      yield this.sendNotification(userId, title, body, {
        type: 'expiry_alert',
        count: expiringCount.toString(),
      });
    });
  }
  static sendRecipeSuggestion(userId, recipeName) {
    return __awaiter(this, void 0, void 0, function* () {
      const title = '🍽️ New Recipe Match!';
      const body = `Try making ${recipeName} with your ingredients`;
      yield this.sendNotification(userId, title, body, {
        type: 'recipe_suggestion',
        recipe: recipeName,
      });
    });
  }
  static sendAchievementNotification(userId, achievementName, icon) {
    return __awaiter(this, void 0, void 0, function* () {
      const title = `${icon} Achievement Unlocked!`;
      const body = `You earned: ${achievementName}`;
      yield this.sendNotification(userId, title, body, {
        type: 'achievement',
        achievement: achievementName,
      });
    });
  }
  static sendDailyReminder(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      const title = '👋 Time to Cook!';
      const body = "You haven't cooked in 3 days. Check out some easy recipes!";
      yield this.sendNotification(userId, title, body, {
        type: 'daily_reminder',
      });
    });
  }
  static updatePreferences(userId, preferences) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const fields = Object.keys(preferences)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        const values = [userId, ...Object.values(preferences)];
        yield database_1.default.query(
          `INSERT INTO notification_preferences (user_id, ${Object.keys(preferences).join(', ')})
         VALUES ($1, ${Object.keys(preferences)
           .map((_, i) => `$${i + 2}`)
           .join(', ')})
         ON CONFLICT (user_id) 
         DO UPDATE SET ${fields}, updated_at = CURRENT_TIMESTAMP`,
          values,
        );
      } catch (error) {
        console.error('Error updating notification preferences:', error);
      }
    });
  }
  static getPreferences(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield database_1.default.query(
          'SELECT * FROM notification_preferences WHERE user_id = $1',
          [userId],
        );
        if (result.rows.length === 0) {
          return {
            expiry_alerts: true,
            recipe_suggestions: true,
            achievement_notifications: true,
            daily_reminders: true,
          };
        }
        return result.rows[0];
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        return null;
      }
    });
  }
  static sendTestNotification(userId) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        yield this.sendNotification(
          userId,
          '🧪 Test Notification',
          'If you see this, notifications are working!',
          {type: 'test'},
        );
        return true;
      } catch (error) {
        console.error('Test notification failed:', error);
        return false;
      }
    });
  }
}
exports.PushNotificationService = PushNotificationService;
