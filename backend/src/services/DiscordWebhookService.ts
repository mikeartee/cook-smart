import axios from 'axios';

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  thumbnail?: {
    url: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export class DiscordWebhookService {
  private static webhookUrls = {
    newUser: process.env.DISCORD_ACTIVITY_WEBHOOK || '',
    newRecipe: process.env.DISCORD_ACTIVITY_WEBHOOK || '',
    feedback: process.env.DISCORD_FEEDBACK_WEBHOOK || '',
    errors: process.env.DISCORD_ERROR_WEBHOOK_URL || '',
  };

  static async sendNewUserNotification(
    username: string,
    email: string,
    referralCode?: string,
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: '🎉 New User Joined!',
      color: 0x4caf50,
      fields: [
        {name: 'Username', value: username, inline: true},
        {name: 'Email', value: email, inline: true},
      ],
      timestamp: new Date().toISOString(),
    };

    if (referralCode) {
      embed.fields?.push({
        name: 'Referral Code',
        value: referralCode,
        inline: true,
      });
    }

    await this.sendWebhook('newUser', {
      embeds: [embed],
      username: 'Cook Smart Bot',
      avatar_url: 'https://example.com/bot-avatar.png',
    });
  }

  static async sendNewRecipeNotification(
    recipeTitle: string,
    username: string,
    cuisine: string,
    difficulty: string,
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: '🍳 New Recipe Added!',
      description: `**${recipeTitle}** by ${username}`,
      color: 0xff9800,
      fields: [
        {name: 'Cuisine', value: cuisine, inline: true},
        {name: 'Difficulty', value: difficulty, inline: true},
      ],
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook('newRecipe', {
      embeds: [embed],
      username: 'Cook Smart Bot',
    });
  }

  static async sendFeedbackNotification(
    username: string,
    feedback: string,
    rating?: number,
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: '💬 New Feedback',
      description: feedback,
      color: 0x2196f3,
      fields: [{name: 'User', value: username, inline: true}],
      timestamp: new Date().toISOString(),
    };

    if (rating) {
      embed.fields?.push({
        name: 'Rating',
        value: `${rating}/5 ⭐`,
        inline: true,
      });
    }

    await this.sendWebhook('feedback', {
      embeds: [embed],
      username: 'Cook Smart Bot',
    });
  }

  static async sendErrorNotification(
    errorMessage: string,
    context?: string,
  ): Promise<void> {
    const embed: any = {
      title: '🚨 Application Error',
      description: errorMessage,
      color: 0xf44336,
      ...(context && {fields: [{name: 'Context', value: context}]}),
      timestamp: new Date().toISOString(),
    };

    await this.sendWebhook('errors', {
      embeds: [embed],
      username: 'Cook Smart Error Bot',
    });
  }

  private static async sendWebhook(
    type: keyof typeof this.webhookUrls,
    payload: DiscordWebhookPayload,
  ): Promise<void> {
    const webhookUrl = this.webhookUrls[type];

    if (!webhookUrl) {
      console.warn(`Discord webhook URL not configured for type: ${type}`);
      return;
    }

    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (webhookError) {
      console.error(`Failed to send Discord webhook (${type}):`, webhookError);
    }
  }

  static async testWebhook(
    type: keyof typeof this.webhookUrls,
  ): Promise<boolean> {
    try {
      await this.sendWebhook(type, {
        content: '🧪 Test message from Cook Smart',
        username: 'Cook Smart Test Bot',
      });
      return true;
    } catch (_error) {
      return false;
    }
  }
}
