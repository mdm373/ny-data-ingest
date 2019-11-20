webpack ./.temp/tsc/$1/index.js -o ./.temp/bin/$1/index.js --mode production --config ./webpack.config.js
zip -j ./.temp/bin/$1.zip ./.temp/bin/$1/index.js

aws lambda update-function-code --zip-file fileb://./.temp/bin/$1.zip --function-name nyc-data-ingest-$1