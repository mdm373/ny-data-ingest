if [ -z ${LAMBDA_ROLE+x} ]; then
    read -p "IAM Role: " LAMBDA_ROLE
fi

mkdir  -p .temp
echo "module.exports =  { handler: () => ({}) }" > .temp/index.js
zip  -j .temp/empty.zip .temp/index.js

sh ./scripts/create-fn.sh create-tables
sh ./scripts/create-fn.sh push-rows