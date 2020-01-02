import { promptDropTable } from "../common/prompt-drop-table"
import { connect, DbAccess } from "../common/db-access"
import { createPrompt, Prompt } from "../common/prompt"
import { loadQuery } from "../common/load-query"
import { Bar, Presets } from "cli-progress"
import { readFile } from "fs-extra"
import {Mapper} from "./mapper"
import {map as cdPopInteropMapper} from "./cd-pop-interop-mapper"

type TimeSeriesConfig = Readonly<{
    seriesName: string,
    displayName: string,
    tableName: string,
    boundType: string,
    valueName: string,
}>

const mappers: {readonly [key: string]: Mapper} = {
    "cd-pop-interpol" : cdPopInteropMapper
}



const handleConfig = async(config: TimeSeriesConfig, db: DbAccess, prompt: Prompt) => {
    const seriesName = config.seriesName
    const tableName = config.tableName
    if(!(await promptDropTable(db, prompt, tableName)).tableExists){
        await db.query(await loadQuery('series_table_create.sql', {tableName}))
        console.log(`series table created: ${tableName}`)
    }
    
    await db.queryNamed(`update-type`, await loadQuery("series_type_insert.sql", {tableName: 'series_types'}), Object.values(config))
    const mappedRows = await mappers[config.seriesName](db)
    const total = mappedRows.length
    let end = 0
    const bar = new Bar({
        format: `inserting ${seriesName} {bar} {percentage}% | {eta}s`,
        hideCursor: true
    }, Presets.rect)
    bar.start(total, 0)
    const keys = Object.keys(mappedRows[0]).join(',')
    while(end < total) {
        const start = end
        end = end + 2000
        const queryInfo = mappedRows.slice(start, end).reduce((queryData, row, rowIndex) => {
            const offset = rowIndex*5
            queryData.query.push(`(${Object.keys(row).map( (_, index) => `$${offset+index+1}`).join(',')})`)
            queryData.values = queryData.values.concat(Object.values(row))
            return queryData
        }, {query: [] as string[], values: [] as any[], serial: Promise.resolve(true)})
        const query = `INSERT INTO ${tableName} (${keys}) VALUES ${queryInfo.query.join(',')} ON CONFLICT DO NOTHING`
        await db.queryNamed(
            `sql-insert-${queryInfo.values.length}`,
            query,
            queryInfo.values,
        )
        bar.update(end)
    }
    bar.stop()
}


export const handler = async () => {
    const configs: readonly TimeSeriesConfig[] = JSON.parse(await readFile('./configs/time-series-config.json', 'UTF-8'))
    const db = await connect()
    const prompt = createPrompt()
    await configs.reduce(async (configPromise, config) => {
        await configPromise
        await handleConfig(config, db, prompt)
        return true
    }, Promise.resolve(true))
    try {
        
    } finally {
        await db.end()
        prompt.close()
    }
}