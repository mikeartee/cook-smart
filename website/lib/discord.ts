import { DISCORD_WEBHOOK_URL } from './constants';

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Send a Discord webhook notification
 * This function should only be called from server-side code (API routes)
 */
export async function sendDiscordNotification(
  payload: DiscordWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  // Check if webhook URL is configured
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Discord webhook URL is not configured');
    return { success: false, error: 'Discord webhook not configured' };
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send Discord notification:', error);
      return { success: false, error: 'Failed to send Discord notification' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return { success: false, error: 'Failed to send Discord notification' };
  }
}

/**
 * Send a beta request notification to Discord
 */
export async function sendBetaRequestNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Check if this looks like a beta request
  const isBetaRequest =
    subject.toLowerCase().includes('beta') ||
    message.toLowerCase().includes('beta') ||
    message.toLowerCase().includes('test') ||
    subject.toLowerCase().includes('join') ||
    subject.toLowerCase().includes('access') ||
    subject.toLowerCase().includes('early') ||
    message.toLowerCase().includes('early') ||
    message.toLowerCase().includes('download') ||
    subject.toLowerCase().includes('download');

  if (!isBetaRequest) {
    // Not a beta request, skip Discord notification
    return { success: true };
  }

  const embed: DiscordEmbed = {
    title: '🎉 New Beta Request!',
    description: `**${name}** has submitted a beta request`,
    color: 0x4caf50, // Green color
    fields: [
      {
        name: '👤 Name',
        value: name,
        inline: true,
      },
      {
        name: '📧 Email',
        value: email,
        inline: true,
      },
      {
        name: '📝 Subject',
        value: subject,
        inline: false,
      },
      {
        name: '💬 Message',
        value: message.length > 1000 ? message.substring(0, 1000) + '...' : message,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Cook Smart Website - Beta Request',
    },
  };

  return sendDiscordNotification({
    embeds: [embed],
    username: 'Cook Smart Beta Bot',
    avatar_url: 'https://cooksmartapp.com/favicon.ico',
  });
}

/**
 * Send a general contact form notification to Discord
 */
export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const embed: DiscordEmbed = {
    title: '📬 New Contact Form Submission',
    description: `**${name}** has sent a message`,
    color: 0x2196f3, // Blue color
    fields: [
      {
        name: '� Nabme',
        value: name,
        inline: true,
      },
      {
        name: '� Emailg',
        value: email,
        inline: true,
      },
      {
        name: '📝 Subject',
        value: subject,
        inline: false,
      },
      {
        name: '💬 Message',
        value: message.length > 1000 ? message.substring(0, 1000) + '...' : message,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Cook Smart Website - Contact Form',
    },
  };

  return sendDiscordNotification({
    embeds: [embed],
    username: 'Cook Smart Contact Bot',
    avatar_url: 'https://cooksmartapp.com/favicon.ico',
  });
}

/**
 * Test Discord webhook connection
 */
export async function testDiscordWebhook(): Promise<{ success: boolean; error?: string }> {
  const testEmbed: DiscordEmbed = {
    title: '🧪 Discord Test',
    description: 'Testing Discord webhook integration from Cook Smart website',
    color: 0x9c27b0, // Purple color
    fields: [
      {
        name: '🔧 Test Type',
        value: 'Website Integration Test',
        inline: true,
      },
      {
        name: '⏰ Time',
        value: new Date().toLocaleString(),
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Cook Smart Website - Test',
    },
  };

  return sendDiscordNotification({
    embeds: [testEmbed],
    username: 'Cook Smart Test Bot',
    avatar_url: 'https://cooksmartapp.com/favicon.ico',
  });
}
