#!/bin/bash
# Create RDS PostgreSQL instance for Cook Smart
# Uses AWS credits - FREE for 7 months

aws rds create-db-instance \
  --db-instance-identifier cook-smart-db-beta \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username cooksmartadmin \
  --master-user-password "CookSmart2024!" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids default \
  --publicly-accessible \
  --backup-retention-period 7 \
  --db-name cooksmartdb \
  --region us-east-1 \
  --tags Key=Project,Value=CookSmart Key=Environment,Value=Beta

echo "RDS instance creation initiated..."
echo "This will take 5-10 minutes to complete."
echo "Run 'aws rds describe-db-instances --db-instance-identifier cook-smart-db-beta' to check status"
