aws lambda create-function --cli-input-json file://config/create-fn.json --role ${LAMBDA_ROLE} --zip-file fileb://.temp/empty.zip --function-name nyc-data-ingest-$1