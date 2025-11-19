# Fix RDS Security Group - Step by Step

## What You Need to Do

Your EC2 server can't talk to your RDS database because the database's firewall (security group) is blocking it. We need to add a rule to allow the EC2 server in.

## Step-by-Step Instructions

### Step 1: Find Your RDS Database Security Group

1. Go to AWS Console: https://console.aws.amazon.com/rds/
2. Click "Databases" in the left sidebar
3. Click on your database: `cook-smart-db-beta`
4. Scroll down to "Connectivity & security" section
5. Look for "VPC security groups" - you'll see a link like `default (sg-xxxxx)` or similar
6. **Click on that security group link** - this opens the security group in a new tab

### Step 2: Edit Inbound Rules

Now you should be on the Security Group page:

1. Look for the "Inbound rules" tab at the bottom
2. Click "Edit inbound rules" button (orange button on the right)
3. Click "Add rule" button

### Step 3: Add the PostgreSQL Rule

Fill in the new rule:

**Type:** 
- Click the dropdown
- Search for "PostgreSQL" 
- Select "PostgreSQL" (it will auto-fill Port to 5432)

**Source:**
- Click the dropdown next to "Custom"
- Select "Custom"
- In the search box, type: `sg-0a3da0dcef5710f8c`
  (This is your EC2 security group from your screenshot)
- Select it when it appears

**Description (optional):**
- Type: "Allow EC2 backend to connect"

### Step 4: Save

1. Click "Save rules" (orange button at bottom right)
2. Wait for it to say "Successfully modified"

## Alternative: Use IP Address Instead

If you can't find the EC2 security group, use the EC2's IP instead:

1. When adding the rule, for "Source" select "Custom"
2. Type: `3.237.38.24/32`
3. Save

## How to Know It Worked

After saving, run this command in PowerShell:

```powershell
.\test-deployment.ps1
```

If it worked, you'll see:
- ✅ Health check passed
- Database: True

If it still fails, the security group might not have updated yet (wait 30 seconds and try again).

## Still Stuck?

If you're still having trouble, take a screenshot of:
1. The RDS database "Connectivity & security" section
2. The security group inbound rules page

And I'll help you figure it out!
