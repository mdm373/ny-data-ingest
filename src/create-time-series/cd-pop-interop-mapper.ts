import { connect, DbAccess } from "../common/db-access"
import { Bar, Presets } from "cli-progress"
import {default as moment} from 'moment'
import { InteropRow, Mapper } from "./mapper"
const everpolate = require('everpolate')

type PopulationRow = Readonly<{
    borough: string,
    cd_number: string,
    cd_name: string,
    [key: string] : string
}>


const boroughPrefix: {readonly [key: string]: string} = {
    "MANHATTAN": "1",
    "BRONX" : "2",
    "BROOKLYN" : "3",
    "QUEENS": "4",
    "STATEN ISLAND": "5",
}

const getDays = (start: number, end: number, exterpolate: moment.Duration): readonly number[] => {
    const endTime = moment.unix(end).utc().add(exterpolate).unix()
    let dayMoment = moment.unix(start).utc()
    let allDays: number[] = []
    while(dayMoment.unix() < endTime) {
        allDays.push(dayMoment.unix())
        dayMoment = dayMoment.add(1, 'days')
    }
    return allDays
}

export const map: Mapper = async (db: DbAccess) => {
    const results = await db.query<PopulationRow>("SELECT * FROM community_district_populations")
    const rows = results.rows
    let allDays10YearsExterpolated: readonly number[] = []
    let years: readonly number[] = []
    let index = 0
    const bar = new Bar({
        format: "interpolating {bar} {percentage}% | {eta}s",
        hideCursor: true
    }, Presets.rect)
    const mapped = rows.map((row) => {
        const cdId = boroughPrefix[row.borough.toUpperCase()].concat(row.cd_number.length < 2 ? "0".concat(row.cd_number) : row.cd_number)
        
        const yearMap = Object.keys(row).map((key) => {
            const match = key.match(/^_(\d*)_population$/)
            return (match && match[0]) ? [[match[1]], row[key]] as string[] : undefined
        }).reduce((agg, current) => {
            if(current) {
                const yearTime = moment(`${Number.parseInt(current[0])}-01-01T00:00:00Z`).unix()
                agg[yearTime] = Number.parseInt(current[1])
            }
            return agg
        }, {} as {[key: number]: number})
        if(allDays10YearsExterpolated.length == 0) {
            years = Object.keys(yearMap).map(year => Number.parseInt(year))
            if(years.length < 2) {
                throw new Error(`invalid year census data for row ${row.borough} ${row.cd_number}`)
            }
            allDays10YearsExterpolated = getDays(years[0], years[years.length-1], moment.duration(10,  'years'))
            bar.start(allDays10YearsExterpolated.length * rows.length, 0)
        }
        const polyData = (everpolate.polynomial(allDays10YearsExterpolated, years, Object.values(yearMap)) as number[])
            .map((val) => (val + .5).toFixed(0))
        return {cdId, polyData}
    }).reduce((agg, current, aggIndex) => {
        agg = agg.concat(current.polyData.map((polyData, polyIndex): InteropRow => ({
            id: index++,
            bound_id: current.cdId,
            timestamp: moment.unix(allDays10YearsExterpolated[polyIndex]).utc().format(),
            value: Number.parseInt(polyData),
        })))
        bar.update(aggIndex*current.polyData.length)
        return agg
        }, [] as InteropRow[]
    )
    bar.stop()
    return mapped
}