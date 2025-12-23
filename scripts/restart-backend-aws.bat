@echo off
echo ========================================
echo Restarting Backend via AWS
echo ========================================
echo.

echo Stopping EC2 instance...
aws ec2 stop-instances --instance-ids i-05e0746da4f5f9da0
echo.

echo Waiting for instance to stop...
aws ec2 wait instance-stopped --instance-ids i-05e0746da4f5f9da0
echo.

echo Starting EC2 instance...
aws ec2 start-instances --instance-ids i-05e0746da4f5f9da0
echo.

echo Waiting for instance to start...
aws ec2 wait instance-running --instance-ids i-05e0746da4f5f9da0
echo.

echo Getting new IP address...
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --query "Reservations[0].Instances[0].PublicIpAddress" --output text
echo.

echo ========================================
echo Backend Restart Complete!
echo Wait 2-3 minutes for services to start
echo ========================================
pause