import {createReadStream} from 'fs'
import {Observable, Subscriber, from} from 'rxjs'
import {take, map,  mergeMap, catchError} from 'rxjs/operators'
import { stat } from 'fs-extra'
import {Bar, Presets} from 'cli-progress'
import { connect, NypdTables } from '../common/db-access'
import {default as through2} from 'through2'
import { Transform } from 'stream'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('csv-parser')

const getStreamTransform = (highWaterMark: number): {transform: Transform; releasePressure: () => void} => {
    const pending: through2.TransformCallback[] = []
    const update = (): void => {
        const op = pending.pop()
        if(op) {
            setTimeout(op, 0)
        }
    }
    return {
        transform: through2({highWaterMark, objectMode: true}, function (record,  _, callback) {
            pending.push(callback)
            this.push(record)
        }),
        releasePressure: update
    }
}

type FileLine = Readonly<{
    line: {readonly[key: string]: string|null};
    totalBytesRead: number;
    lineNumber: number;
}>

const getFileByLine = (fileName: string, backPressure: number): {obs: Observable<FileLine>; releaseBackPressure: () => void; getLast: () => FileLine|undefined } => {
    const transformOps = getStreamTransform(backPressure)
    let last: FileLine|undefined
    const obs = new Observable((observer: Subscriber<FileLine>) => {
        let lineNumber = -1;
        const stream = createReadStream(fileName)
        stream.pipe(csv()).pipe(transformOps.transform)
            .on('data', (line:  {readonly[key: string]: string}) => {
                lineNumber++
                last = {line, totalBytesRead: stream.bytesRead, lineNumber}
                observer.next(last)
            })
            .on('error', (error: Error) => {
                stream.close()
                observer.error(error)
            })
            .on('end', () => {
                stream.close()
            })
        return (): void => {
            stream.close()
        }
    })
    return { releaseBackPressure: transformOps.releasePressure, obs, getLast: (): FileLine|undefined => last }
}

const bToMb = 1 / (1024 * 1024)
const updateProgressBar = (bar: Bar, totalBytesRead: number, lines: number): void => {
    const mem = process.memoryUsage()
    const mbUsed = (mem.heapUsed * bToMb).toLocaleString(undefined, {maximumFractionDigits: 2})
    bar.update(totalBytesRead, {lines: lines.toLocaleString(), mbUsed})
}

const lowerLineKeys = (raw: FileLine): FileLine => {
    const line = Object.keys(raw.line).reduce((agg, current) => {
        agg[current.toLowerCase()] = raw.line[current]
        return agg
    }, {} as {[key: string]: string|null})
    return {...raw, line}
}
const cleanUp = (raw: FileLine): FileLine => {
    const line = Object.keys(raw.line).reduce((agg, current) => {
        if(current.endsWith('_tm')){
            const dateKey = current.replace("_tm", "_dt")
            const value = raw.line[current] || "00:00"
            agg[dateKey] = agg[dateKey] ? (agg[dateKey] || "01-01-9999 00:00").split(' ')[0] + ` ${value}` : `01-01-9999 ${value}`
        } else if(current.endsWith('_dt')) {
            const converted = (raw.line[current]||"01/01/9999").replace(/"\/"/g, '-')
            agg[current] = agg[current] ? `${converted} ` + (agg[current] || "01/01/9999 00:00").split(' ')[1] : `${converted} 00:00`
        } else if(raw.line[current] === "") {
            agg[current] = null; 
        } else {
            agg[current] = raw.line[current]
        }
        return agg
    }, {} as {[key: string]: string|null})
    return {...raw, line}
}

export const handler = async (): Promise<void> => {
    const fileName = '.dat/nypd-complaint-ytd.csv'
    
    const client = await connect()
    const bar = new Bar({
        format: "ingesting {bar} {percentage}% | {lines} lines processed | {mbUsed} MB",
        hideCursor: true
    }, Presets.rect)
    
    const fileStats = await stat(fileName)
    const fileByLine = getFileByLine(fileName, 100)
    
    console.log(`'${fileName}:`)
    bar.start(fileStats.size, 0)
    let query: string|undefined = undefined
    const interval = setInterval(() => {
        const last = fileByLine.getLast()
        if(last) {
            updateProgressBar(bar, last.totalBytesRead, last.lineNumber)
        }
    }, 1000)
    try {
        await new Promise((complete, reject) => {
            fileByLine.obs.pipe(
                map(lowerLineKeys),
                map(cleanUp),
                mergeMap((lineData) => {
                    if(!query) {
                        const keys = Object.keys(lineData.line).join(', ')
                        const valuePlaces = Object.keys(lineData.line).map((_, index) => `$${index+1}`).join(', ')
                        query = `INSERT INTO ${NypdTables.complaints} (${keys}) VALUES (${valuePlaces})`
                    }
                    const values = Object.values(lineData.line || {}) || []
                    //return of(lineData)
                    //throw new Error(query)
                    return from(client.queryNamed('insert-row', query, values)).pipe(
                        take(1),
                        map(() => lineData),
                        catchError((error) => {
                            throw query + " : " + error.message
                        }),
                    )
                }),
            ).subscribe(
                fileByLine.releaseBackPressure,
                reject,
                complete
            )
        })
    } finally {
        clearInterval(interval)
        bar.stop()
        client.end()
    }
}
