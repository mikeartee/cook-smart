import {DiscordWebhookService} from './DiscordWebhookService';

export interface ActivityEvent {
  userId: string;
  username: string;
  type:
    | 'recipe_shared'
    | 'achievement_unlocked'
    | 'milestone_reached'
    | 'community_contribution';
  data: any;
  timestamp: Date;
}

export class CommunityActivityService {
  static async trackRecipeShare(
    userId: string,
    username: string,
    recipeTitle: string,
    platform: string,
  ): Promise<void> {
    const activity: ActivityEvent = {
      userId,
      username,
      type: 'recipe_shared',
      data: {recipeTitle, platform},
      timestamp: new Date(),
    };

    await this.processActivity(activity);
  }

  static async trackAchievementUnlocked(
    userId: string,
    username: string,
    achievement: string,
    description: string,
  ): Promise<void> {
    const activity: ActivityEvent = {
      userId,
      username,
      type: 'achievement_unlocked',
      data: {achievement, description},
      timestamp: new Date(),
    };

    await this.processActivity(activity);
  }

  static async trackMilestoneReached(
    userId: string,
    username: string,
    milestone: string,
    value: number,
  ): Promise<void> {
    const activity: ActivityEvent = {
      userId,
      username,
      type: 'milestone_reached',
      data: {milestone, value},
      timestamp: new Date(),
    };

    await this.processActivity(activity);
  }

  static async trackCommunityContribution(
    userId: string,
    username: string,
    contribution: string,
    impact: string,
  ): Promise<void> {
    const activity: ActivityEvent = {
      userId,
      username,
      type: 'community_contribution',
      data: {contribution, impact},
      timestamp: new Date(),
    };

    await this.processActivity(activity);
  }

  private static async processActivity(activity: ActivityEvent): Promise<void> {
    // Send Discord notification for significant activities
    await this.sendDiscordNotification(activity);

    // Store activity in database (would be implemented with actual DB)
    console.log('Activity tracked:', activity);
  }

  private static async sendDiscordNotification(
    activity: ActivityEvent,
  ): Promise<void> {
    try {
      switch (activity.type) {
        case 'recipe_shared':
          await DiscordWebhookService.sendNewRecipeNotification(
            activity.data.recipeTitle,
            activity.username,
            'shared',
            activity.data.platform,
          );
          break;

        case 'achievement_unlocked':
          await this.sendAchievementNotification(activity);
          break;

        case 'milestone_reached':
          await this.sendMilestoneNotification(activity);
          break;

        case 'community_contribution':
          await this.sendContributionNotification(activity);
          break;
      }
    } catch (error) {
      console.error('Failed to send Discord notification for activity:', error);
    }
  }

  private static async sendAchievementNotification(
    activity: ActivityEvent,
  ): Promise<void> {
    // Custom webhook call for achievements
    const webhookUrl =
      process.env.DISCORD_WEBHOOK_COMMUNITY ||
      process.env.DISCORD_ACTIVITY_WEBHOOK ||
      '';
    if (!webhookUrl) return;

    const payload = {
      embeds: [
        {
          title: '🏆 Achievement Unlocked!',
          description: `**${activity.username}** earned: ${activity.data.achievement}`,
          color: 0xffd700,
          fields: [{name: 'Description', value: activity.data.description}],
          timestamp: activity.timestamp.toISOString(),
        },
      ],
      username: 'Cook Smart Community',
    };

    // Would use axios.post(webhookUrl, payload) in real implementation
    console.log('Achievement notification:', payload);
  }

  private static async sendMilestoneNotification(
    activity: ActivityEvent,
  ): Promise<void> {
    const webhookUrl =
      process.env.DISCORD_WEBHOOK_COMMUNITY ||
      process.env.DISCORD_ACTIVITY_WEBHOOK ||
      '';
    if (!webhookUrl) return;

    const payload = {
      embeds: [
        {
          title: '🎯 Milestone Reached!',
          description: `**${activity.username}** reached ${activity.data.milestone}`,
          color: 0x9c27b0,
          fields: [
            {
              name: 'Value',
              value: activity.data.value.toString(),
              inline: true,
            },
          ],
          timestamp: activity.timestamp.toISOString(),
        },
      ],
      username: 'Cook Smart Community',
    };

    console.log('Milestone notification:', payload);
  }

  private static async sendContributionNotification(
    activity: ActivityEvent,
  ): Promise<void> {
    const webhookUrl =
      process.env.DISCORD_WEBHOOK_COMMUNITY ||
      process.env.DISCORD_ACTIVITY_WEBHOOK ||
      '';
    if (!webhookUrl) return;

    const payload = {
      embeds: [
        {
          title: '🤝 Community Contribution!',
          description: `**${activity.username}** made a contribution`,
          color: 0x4caf50,
          fields: [
            {name: 'Contribution', value: activity.data.contribution},
            {name: 'Impact', value: activity.data.impact},
          ],
          timestamp: activity.timestamp.toISOString(),
        },
      ],
      username: 'Cook Smart Community',
    };

    console.log('Contribution notification:', payload);
  }

  static getActivityTypes(): string[] {
    return [
      'recipe_shared',
      'achievement_unlocked',
      'milestone_reached',
      'community_contribution',
    ];
  }
}
