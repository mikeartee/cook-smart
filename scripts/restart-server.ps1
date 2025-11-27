ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart-backend && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 50"
