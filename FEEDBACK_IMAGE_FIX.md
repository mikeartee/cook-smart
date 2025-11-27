# Feedback Image Attachment Fix

## Problem
When users submit feedback with an attached screenshot, only the text appears in Discord - the image is missing.

## Root Cause
Discord webhooks don't support base64 data URLs in image embeds. They require either:
1. Actual HTTP/HTTPS URLs to hosted images
2. File attachments sent via multipart/form-data

The original implementation tried to embed base64 images directly, which Discord silently ignores.

## Solution
Updated the notification system to send screenshots as file attachments using multipart/form-data instead of trying to embed base64 data URLs.

## Changes Made

### File: `backend/src/services/NotificationService.ts`

**1. Updated `sendFeedbackNotification` method:**
```typescript
// If screenshot is provided, send as file attachment
if (feedback.screenshot) {
  await this.sendToWebhookWithFile(
    this.feedbackWebhook,
    embed,
    feedback.screenshot,
    'feedback',
  );
} else {
  await this.sendToWebhook(this.feedbackWebhook, embed, 'feedback');
}
```

**2. Added new `sendToWebhookWithFile` method:**
```typescript
private async sendToWebhookWithFile(
  webhookUrl: string,
  payload: any,
  base64Image: string,
  type: string,
  retries = 3,
): Promise<void> {
  // Extract base64 data and convert to buffer
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Create form data with image attachment
  const FormData = require('form-data');
  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload));
  form.append('file', imageBuffer, {
    filename: 'screenshot.jpg',
    contentType: 'image/jpeg',
  });

  // Send to Discord
  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
}
```

**3. Updated embed to indicate attachment:**
```typescript
// Add note if screenshot is attached
if (feedback.screenshot) {
  fields.push({
    name: '📎 Attachment',
    value: 'Screenshot attached below',
    inline: false,
  });
}
```

## How It Works

1. **User captures screenshot** in FeedbackModal (camera or gallery)
2. **Image converted to base64** data URL format
3. **Sent to backend** in feedback submission
4. **Stored in database** in `screenshot_url` field
5. **Backend converts base64 to Buffer** for Discord
6. **Sent to Discord as file attachment** using multipart/form-data
7. **Image appears in Discord** as a downloadable attachment

## Discord Message Structure

The Discord webhook now sends:
- **Embed**:
  - Title: 💬 NEW FEEDBACK
  - Fields: User info, rating, category, message
  - Attachment indicator: "📎 Screenshot attached below"
  - Footer: Cook Smart Feedback
  - Timestamp: When feedback was submitted
- **File Attachment**: screenshot.jpg (if provided)

## Testing

### Test the Fix:

1. Open Cook Smart app
2. Navigate to Home or Profile screen
3. Tap "Send Feedback" button
4. Fill in feedback form:
   - Add a rating (1-5 stars)
   - Select a category
   - Write a message
   - **Tap "Add Screenshot"**
   - Choose "Take Photo" or "Choose from Library"
   - Select/capture an image
5. Submit feedback
6. Check Discord channel - image should now appear in the notification

### Expected Discord Message:

```
💬 NEW FEEDBACK

User: John Doe (john@example.com)
Rating: ⭐⭐⭐⭐⭐
Category: Bug
Time: 2025-11-21 14:30:00 UTC
Message: The app crashes when I try to...
📎 Attachment: Screenshot attached below

Cook Smart Feedback

[FILE ATTACHMENT: screenshot.jpg - Click to view/download]
```

## Deployment Status

✅ Code updated
✅ Backend rebuilt
✅ Backend restarted
✅ Ready for testing

## Technical Notes

- Screenshots are captured as base64 data URLs in the app
- Backend converts base64 to Buffer for Discord
- Sent as multipart/form-data file attachments
- Discord displays them as downloadable image files
- No external image hosting required (S3, Imgur, etc.)
- Images are also stored in the database for future reference
- Uses the `form-data` npm package (already installed)

## Rollback

If needed, revert the changes in `backend/src/services/NotificationService.ts`:

```bash
git checkout backend/src/services/NotificationService.ts
npm run build
# Restart backend
```

