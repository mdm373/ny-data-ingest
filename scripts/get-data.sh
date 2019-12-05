if [ ! -d ".dat" ]; then
    mkdir  .dat
    echo downloading nypd complaint data: historical
    curl https://data.cityofnewyork.us/api/views/qgea-i56i/rows.csv -# -o .dat/nypd-complaint-historical.csv
    echo downloading nypd complaint data: year to date
    curl https://data.cityofnewyork.us/api/views/5uac-w243/rows.csv -# -o .dat/nypd-complaint-ytd.csv
    echo downloading nypd sectors
    curl https://data.cityofnewyork.us/api/views/5rqd-h5ci/rows.csv -# -o .dat/nypd-sectors.csv
fi
