import express from 'express';
import { DiscordBotService } from '../services/DiscordBotService';

const router = express.Router();

// Initialize bot commands
router.post('/initialize', async (req, res) => {
  try {
    DiscordBotService.initializeCommands();
    res.json({ success: true, message: 'Bot commands initialized' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize bot commands' });
  }
});

// Get registered commands
router.get('/commands', async (req, res) => {
  try {
    const commands = DiscordBotService.getRegisteredCommands();
    res.json({ commands });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get commands' });
  }
});

// Process bot command (webhook endpoint)
router.post('/command', async (req, res) => {
  try {
    const { commandName, interaction } = req.body;
    
    if (!commandName) {
      return res.status(400).json({ error: 'Command name required' });
    }
    
    await DiscordBotService.processCommand(commandName, interaction);
    res.json({ success: true, message: 'Command processed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// Send direct message
router.post('/dm', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message required' });
    }
    
    const success = await DiscordBotService.sendDirectMessage(userId, message);
    
    if (success) {
      res.json({ success: true, message: 'Direct message sent' });
    } else {
      res.status(500).json({ error: 'Failed to send direct message' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send direct message' });
  }
});

// Update bot status
router.post('/status', async (req, res) => {
  try {
    const { activity } = req.body;
    
    if (!activity) {
      return res.status(400).json({ error: 'Activity required' });
    }
    
    await DiscordBotService.updateBotStatus(activity);
    res.json({ success: true, message: 'Bot status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bot status' });
  }
});

// Get bot configuration status
router.get('/status', async (req, res) => {
  try {
    const isConfigured = DiscordBotService.isConfigured();
    const commands = DiscordBotService.getRegisteredCommands();
    
    res.json({
      configured: isConfigured,
      commandCount: commands.length,
      commands: commands.map(cmd => ({ name: cmd.name, description: cmd.description }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

export default router;