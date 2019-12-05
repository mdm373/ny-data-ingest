import { Bar, Presets } from "cli-progress"
import { FileObservable } from "./file-observable"
import { stat } from 'fs-extra'

const bToMb = 1 / (1024 * 1024)

export type StopIngestProgressBar =  () => void

const updateProgressBar = (bar: Bar, totalBytesRead: number, lines: number): void => {
    const mem = process.memoryUsage()
    const mbUsed = (mem.heapUsed * bToMb).toLocaleString(undefined, {maximumFractionDigits: 2})
    bar.update(totalBytesRead, {lines: lines.toLocaleString(), mbUsed})
}

export const startIngestProgressBar = async (fileByLine: FileObservable, fps: number): Promise<StopIngestProgressBar> => {
    const fileStats = await stat(fileByLine.fileName)
    const bar = new Bar({
        format: "ingesting {bar} {percentage}% | {lines} lines processed | {mbUsed} MB | {eta}s",
        hideCursor: true
    }, Presets.rect)
    bar.start(fileStats.size, 0)
    const interval = setInterval(() => {
        const last = fileByLine.getLast()
        if(last) {
            updateProgressBar(bar, last.totalBytesRead, last.lineNumber)
        }
    }, 1000 / fps)
    return () => {
        clearInterval(interval)
        bar.stop()
    }
}