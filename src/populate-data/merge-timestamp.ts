import { FileLine } from "./file-observable"

export const mergeTimestamp = (raw: FileLine): FileLine => {
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