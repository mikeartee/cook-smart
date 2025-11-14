@echo off
echo Deploying Cook Smart Infrastructure...

set /p DB_PASSWORD="Enter database password (min 8 characters): "

echo Validating CloudFormation template...
aws cloudformation validate-template --template-body file://cook-smart-infrastructure.yml

if %ERRORLEVEL% NEQ 0 (
    echo Template validation failed!
    pause
    exit /b 1
)

echo Template is valid. Deploying stack...
aws cloudformation deploy ^
    --template-file cook-smart-infrastructure.yml ^
    --stack-name cook-smart-infrastructure-beta ^
    --parameter-overrides Environment=beta DBPassword=%DB_PASSWORD% ^
    --capabilities CAPABILITY_IAM ^
    --region us-east-1

if %ERRORLEVEL% EQU 0 (
    echo Infrastructure deployed successfully!
    echo Getting stack outputs...
    aws cloudformation describe-stacks --stack-name cook-smart-infrastructure-beta --query "Stacks[0].Outputs" --output table
) else (
    echo Deployment failed!
)

pause