#!/bin/sh

aws cloudformation list-exports --output json --no-paginate --query "Exports[?(Name=='basiq-api-host')].{name: Name, value: Value}"
