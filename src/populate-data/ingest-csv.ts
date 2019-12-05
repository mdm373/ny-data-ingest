import {from} from 'rxjs'
import {take, map,  mergeMap, catchError, bufferCount, filter, tap} from 'rxjs/operators'
import { connect } from '../common/db-access'
import { getFileByLine } from './file-observable'
import { startIngestProgressBar } from './ingest-progress'
import moment from 'moment'
import { mergeTimestamp } from './merge-timestamp'
import {lowerLineKeys} from './lower-keys'
import {DataSetConfig} from '../common/data-sets'
type UserDefinedConfig = Readonly<{
    filename: string;
    dataSet: DataSetConfig;
}>

type DefaultableConfig = Partial<Readonly<{
    bufferSize: number
    flowRate: number
    fps: number,
    colNameCorrections: ReadonlyArray<Readonly<{from: string, to: string}>>
}>>

export type IngestConfig = UserDefinedConfig & DefaultableConfig

const defaultConfig: Required<DefaultableConfig> = {
    bufferSize: 1000,
    flowRate: 2.0,
    fps: 24,
    colNameCorrections: [],
}

export const ingestCsv = async (config: IngestConfig): Promise<void> => {
    if(process.env['SKIP_' + (config.dataSet.tableName).toUpperCase()]) {
        console.log('skipped.')
        return
    }
    
    const resolvedConfig = {...defaultConfig, ...config}
    if(resolvedConfig.flowRate < 1.0) {
        throw new Error('flow rate must be greater than 1.0')
    }
    console.log(`running ingest of: '${resolvedConfig.filename}:`)
    const start = moment();

    const client = await connect()
    const bufferSize = resolvedConfig.bufferSize
    const maxPressure = resolvedConfig.bufferSize * resolvedConfig.flowRate
    const fileByLine = getFileByLine(resolvedConfig.filename, maxPressure)
    
    let query: string|undefined = undefined
    const stopProgress = await startIngestProgressBar(fileByLine, resolvedConfig.fps)
    try {
        await new Promise((complete, reject) => {
            fileByLine.obs.pipe(
                map(lowerLineKeys),
                map(mergeTimestamp),
                bufferCount(bufferSize),
                filter((lines) => lines.length !== 0),
                mergeMap((lines) => {
                    if(!query || lines.length !== bufferSize) {
                        const exampleLine = lines[0]
                        const keys = Object.keys(exampleLine.line).map((key) => {
                            const foundCorrection = resolvedConfig.colNameCorrections.find(
                                (correction) => correction.from === key
                            )
                            return foundCorrection && foundCorrection.to || key
                        })
                        const queryKeys = keys.join(', ')
                        const keyCount = keys.length
                        const queryValues = lines.map((_, lineIndex) => 
                            `(${keys.map((_, index) =>`$${ (keyCount*lineIndex) + index + 1}`).join(', ')})`
                        ).join(',')
                        query = `INSERT INTO ${config.dataSet.tableName} (${queryKeys}) VALUES ${queryValues} ON CONFLICT DO NOTHING`
                    }
                    const values = lines.reduce((agg, line) => Object.values(line.line).concat(agg), [] as any[])
                    return from(client.queryNamed(`insert-row-${lines.length}`, query, values)).pipe(
                        take(1),
                        catchError((error) => {
                            throw query + " : " + error.message
                        }),
                        tap(() => {
                            lines.forEach(fileByLine.releasePressure)
                        })
                    )
                }),
            ).subscribe(
                () => {},
                reject,
                complete
            )
        })
    } finally {
        stopProgress()
        client.end()
    }
    const duration = moment().diff(start)
    console.log(`complete. ${(fileByLine.getLast() || {}).lineNumber} lines ingested in ${moment.duration(duration).humanize()}`)
}
