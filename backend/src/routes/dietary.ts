import express from 'express';
import { DietaryRestrictionModel } from '../models/DietaryRestriction';
import { AllergyModel } from '../models/Allergy';

const router = express.Router();

// Get all dietary restrictions
router.get('/restrictions', async (req, res) => {
  try {
    const restrictions = await DietaryRestrictionModel.getAll();
    res.json(restrictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dietary restrictions' });
  }
});

// Get user's dietary restrictions
router.get('/restrictions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const restrictions = await DietaryRestrictionModel.getUserRestrictions(userId);
    res.json(restrictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user restrictions' });
  }
});

// Add user dietary restriction
router.post('/restrictions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { restrictionId, notes } = req.body;
    await DietaryRestrictionModel.addUserRestriction(userId, restrictionId, notes);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add restriction' });
  }
});

// Add custom dietary restriction
router.post('/restrictions/custom/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, excludedIngredients } = req.body;
    await DietaryRestrictionModel.addCustomRestriction(userId, name, description, excludedIngredients);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add custom restriction' });
  }
});

// Get all allergies
router.get('/allergies', async (req, res) => {
  try {
    const allergies = await AllergyModel.getAll();
    res.json(allergies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch allergies' });
  }
});

// Get user's allergies
router.get('/allergies/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const allergies = await AllergyModel.getUserAllergies(userId);
    res.json(allergies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user allergies' });
  }
});

// Add user allergy
router.post('/allergies/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { allergyId, severityOverride, notes } = req.body;
    await AllergyModel.addUserAllergy(userId, allergyId, severityOverride, notes);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add allergy' });
  }
});

// Add custom allergy
router.post('/allergies/custom/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, severity, description, triggerIngredients } = req.body;
    await AllergyModel.addCustomAllergy(userId, name, severity, description, triggerIngredients);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add custom allergy' });
  }
});

export default router;