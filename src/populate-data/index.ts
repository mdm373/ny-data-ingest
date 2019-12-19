import { ingestCsv, IngestConfig } from "./ingest-csv"
import { NyDataTableName, dataSets } from "../common/data-sets"

const getDataSetConfig = (tableName: NyDataTableName) => {
    const set = dataSets.find((set) => set.tableName === tableName)
    if(!set){
        throw new Error('config not found for table')
    }
    return set
}
export const handler = async () => {
    const conifgs: ReadonlyArray<IngestConfig> = [
        {
            filename: './.dat/nypd-complaint-ytd.csv',
            dataSet: getDataSetConfig(NyDataTableName.complaints),
        },
        {
            filename: './.dat/nypd-complaint-historical.csv', 
            dataSet: getDataSetConfig(NyDataTableName.complaints),
        },
        {
            filename: './.dat/nypd-sectors.csv',
            dataSet: getDataSetConfig(NyDataTableName.sectors),
            colNameCorrections: [
                {from: 'sctrfloat', to: 'sctr_float'},
                {from: 'sq_milenew', to: 'sq_mile_new'},
            ],
        },
        {
            filename: './.dat/community-districts.csv',
            dataSet: getDataSetConfig(NyDataTableName.communityDistricts),
            colNameCorrections: [
                {from: 'borocd', to: 'boro_cd'},
            ],
        }
    ]
    conifgs.reduce(async (agg, current) => {
        await agg
        await ingestCsv(current)
        return true
    }, Promise.resolve(true))
}