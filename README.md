# NYC Data Ingestion

> Populating Historical / Existing Data into the NYC Data Set

## Sources
* https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Historic/qgea-i56i
* https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Current-Year-To-Date-/5uac-w243

## Pre-Requisits
* aws-cli (authenticated)
* curl / sh terminal

# Install

`npm install`

# Config

fields must be populated either by json key value pair `./.secret.json` or env variable
* NYC_DATA_DB_HOST: hostname of postgre instance running on port 5432.
* NYC_DATA_DB_USER: username for postgre db
* NYC_DATA_DB_PASSWORD: password for postgre db

## Commands
* `npm run create-tables`: builds required tables from open data schema
* `npm run populate-data`: inserts data into tables (historic and ytd)

