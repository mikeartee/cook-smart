'use client';

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function SettingsPage(): React.ReactElement {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Cook Smart',
    siteDescription: 'Your Personal Cooking Assistant',
    supportEmail: 'services.cooksmart@gmail.com',
    maxRecipesPerUser: '100',
    enableUserRegistration: true,
    enableRecipeSubmission: true,
    moderationRequired: true,
    sessionTimeout: '30',
  });

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">General Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                The name displayed across the website
              </p>
            </div>

            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Used in meta tags and SEO
              </p>
            </div>

            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Email address for user support inquiries
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">User Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxRecipes">Max Recipes Per User</Label>
              <Input
                id="maxRecipes"
                type="number"
                value={settings.maxRecipesPerUser}
                onChange={(e) => setSettings({ ...settings, maxRecipesPerUser: e.target.value })}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Maximum number of recipes a user can create
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Enable User Registration</p>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register accounts
                </p>
              </div>
              <Button
                variant={settings.enableUserRegistration ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    enableUserRegistration: !settings.enableUserRegistration,
                  })
                }
              >
                {settings.enableUserRegistration ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Enable Recipe Submission</p>
                <p className="text-sm text-muted-foreground">
                  Allow users to submit their own recipes
                </p>
              </div>
              <Button
                variant={settings.enableRecipeSubmission ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    enableRecipeSubmission: !settings.enableRecipeSubmission,
                  })
                }
              >
                {settings.enableRecipeSubmission ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Content Moderation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Require Moderation</p>
                <p className="text-sm text-muted-foreground">
                  All new content must be approved before publishing
                </p>
              </div>
              <Button
                variant={settings.moderationRequired ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSettings({
                    ...settings,
                    moderationRequired: !settings.moderationRequired,
                  })
                }
              >
                {settings.moderationRequired ? 'Required' : 'Not Required'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Security Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Auto-logout users after this period of inactivity
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Security Notice
                </p>
                <p className="text-amber-800 dark:text-amber-200">
                  Changing security settings may require users to log in again
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
