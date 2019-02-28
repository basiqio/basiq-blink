#!/bin/bash
echo "Starting deploy..."
export Bucket=`aws cloudformation list-exports --output text --query "Exports[?(Name=='basiq-blink-s3-bucket')].Value"`
aws s3 sync dist s3://$Bucket --acl public-read
echo "Deploy ended"
