import { Observable, Subscriber } from "rxjs";
import { PressureRelease, getPressureTransform } from "./pressure-transform";
import { createReadStream } from "fs";
import csv = require('csv-parser')

export type FileLine = Readonly<{
    line: {readonly[key: string]: string|null};
    totalBytesRead: number;
    lineNumber: number;
}>

export type FileObservable = Readonly<{
    obs: Observable<FileLine>;
    releasePressure: PressureRelease
    getLast: () => FileLine|undefined
    fileName: string
}>

export const getFileByLine = (fileName: string, backPressure: number): FileObservable => {
    const transformOps = getPressureTransform(backPressure)
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
                observer.complete()
            })
        return (): void => {
            stream.close()
        }
    })
    return {
        releasePressure: transformOps.releasePressure,
        obs,
        getLast: (): FileLine|undefined => last,
        fileName
    }
}