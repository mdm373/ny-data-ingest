fileName=./.dat/$1.csv
dataName=$2
if [ -e $fileName ]
then
    echo "$fileName exists"
else
    echo "getting $fileName from $dataName"
    curl https://data.cityofnewyork.us/api/views/$dataName/rows.csv -# -o $fileName
fi