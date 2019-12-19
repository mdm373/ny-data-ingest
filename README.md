# NYC Data Ingestion

> Populating Historical / Existing Data into the NYC Data Set

## Sources
 https://opendata.cityofnewyork.us/
 
 See `./configs/data-set-config.json` for specific data set identifiers
## Pre-Requisits
* aws-cli (authenticated)
* curl / sh terminal
* Postgre (Assumed RDS Instance)
## Install

`npm install`

Either run `sql/install_postgris.sql` on postgres RDS instance or install postgis on postgres backend

## Config

fields must be populated either by json key value pair `./.secret.json` or env variable
* NYC_DATA_DB_HOST: hostname of postgre instance running on port 5432.
* NYC_DATA_DB_USER: username for postgre db
* NYC_DATA_DB_PASSWORD: password for postgre db
* SKIP_{TABLE_NAME}: skip tabel for population

## Commands
* tasks
  * `npm run create-tables` - builds required tables from open data schema
  * `npm run populate-data` - inserts data into tables (historic and ytd)
  * `npm run create-precincts` - builds precinct table as a merge of nypd_sectors by precinct
* development
  * `npm run dev` - transpile source in watch mode
  * `npm run handler {{task}}` - seperatly, any task above to run from watched source

