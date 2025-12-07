#!/bin/bash

# Quick fix: Update DNS to current IP
# Run this if IP changed before Elastic IP is set up

CURRENT_IP="34.203.8.150"
REGION="us-east-1"

echo "Updating api.cooksmartapp.com to $CURRENT_IP..."

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name cooksmartapp.com --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

cat > /tmp/route53-change.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.cooksmartapp.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$CURRENT_IP"
          }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file:///tmp/route53-change.json

echo "✅ DNS updated! Wait 5 minutes for propagation."
