#!/bin/bash

# Fix Elastic IP for Cook Smart Backend
# This prevents IP from changing every time EC2 restarts

INSTANCE_ID="i-05e0746da4f5f9da0"
REGION="us-east-1"

echo "=========================================="
echo "Allocating Elastic IP for Cook Smart Backend"
echo "=========================================="
echo ""

# Allocate new Elastic IP
echo "Step 1: Allocating Elastic IP..."
ALLOCATION_OUTPUT=$(aws ec2 allocate-address --region $REGION --domain vpc --output json)
ALLOCATION_ID=$(echo $ALLOCATION_OUTPUT | grep -o '"AllocationId": "[^"]*' | cut -d'"' -f4)
ELASTIC_IP=$(echo $ALLOCATION_OUTPUT | grep -o '"PublicIp": "[^"]*' | cut -d'"' -f4)

echo "✅ Elastic IP allocated: $ELASTIC_IP"
echo "   Allocation ID: $ALLOCATION_ID"
echo ""

# Associate Elastic IP with instance
echo "Step 2: Attaching Elastic IP to EC2 instance..."
aws ec2 associate-address \
  --region $REGION \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOCATION_ID

echo "✅ Elastic IP attached to instance"
echo ""

# Update Route 53
echo "Step 3: Updating Route 53 DNS record..."
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
            "Value": "$ELASTIC_IP"
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

echo "✅ Route 53 updated"
echo ""

echo "=========================================="
echo "✅ COMPLETE!"
echo "=========================================="
echo ""
echo "Your backend now has a PERMANENT IP address: $ELASTIC_IP"
echo "DNS: api.cooksmartapp.com → $ELASTIC_IP"
echo ""
echo "This IP will NEVER change, even if you stop/start the instance."
echo ""
echo "Note: Elastic IPs are FREE when attached to a running instance."
echo "      You only pay if the IP is allocated but not attached."
echo ""
