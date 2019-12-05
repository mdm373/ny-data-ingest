import { FileLine } from './file-observable'

export const lowerLineKeys = (raw: FileLine): FileLine => {
    const line = Object.keys(raw.line).reduce((agg, current) => {
        agg[current.toLowerCase()] = raw.line[current]
        return agg
    }, {} as {[key: string]: string|null})
    return {...raw, line}
}