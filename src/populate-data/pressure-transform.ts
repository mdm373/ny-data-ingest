import { Transform } from "stream"
import through2 = require("through2")

export type PressureRelease = () => void

export type PressureTransform = Readonly<{
    transform: Transform,
    releasePressure: PressureRelease
}>
export const getPressureTransform = (maxPressure: number): PressureTransform => {
    const pending: (through2.TransformCallback|undefined)[] = []
    const update = (): void => {
        const popped = pending.length > 0 && pending.pop()
        popped && popped()
    }
    return {
        transform: through2({highWaterMark: maxPressure, objectMode: true, allowHalfOpen: true, }, function (record,  _, cb) {
            pending.length < maxPressure && setTimeout(cb, 0)
            pending.push(pending.length < maxPressure ? undefined : cb)
            this.push(record)
        }),
        releasePressure: update
    }
}