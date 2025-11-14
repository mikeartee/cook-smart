@echo off
echo Checking AWS costs and free tier usage...

echo.
echo === Current Month Costs ===
aws ce get-cost-and-usage ^
    --time-period Start=2024-12-01,End=2024-12-31 ^
    --granularity MONTHLY ^
    --metrics BlendedCost ^
    --query "ResultsByTime[0].Total.BlendedCost.Amount" ^
    --output text

echo.
echo === Free Tier Usage (RDS) ===
aws cloudwatch get-metric-statistics ^
    --namespace AWS/RDS ^
    --metric-name DatabaseConnections ^
    --dimensions Name=DBInstanceIdentifier,Value=cook-smart-db-beta ^
    --start-time 2024-12-01T00:00:00Z ^
    --end-time 2024-12-31T23:59:59Z ^
    --period 86400 ^
    --statistics Average ^
    --query "Datapoints[0].Average" ^
    --output text

echo.
echo === S3 Storage Usage ===
aws cloudwatch get-metric-statistics ^
    --namespace AWS/S3 ^
    --metric-name BucketSizeBytes ^
    --dimensions Name=BucketName,Value=cook-smart-storage-beta-976289921508 Name=StorageType,Value=StandardStorage ^
    --start-time 2024-12-01T00:00:00Z ^
    --end-time 2024-12-31T23:59:59Z ^
    --period 86400 ^
    --statistics Average ^
    --query "Datapoints[-1].Average" ^
    --output text

echo.
echo === EC2 Instance Hours (when created) ===
echo Check AWS Console for detailed free tier usage

pause