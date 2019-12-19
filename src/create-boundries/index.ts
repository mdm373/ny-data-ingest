import { BoundryTableConfig, createBoundryTable } from "./create-bounds"
import { readFile } from "fs-extra"

export const handler = async () => {
    const configs: readonly BoundryTableConfig[] = JSON.parse(
        await readFile('./configs/geom-config.json', 'UTF-8'),
    )
    await configs.reduce( async (agg, current) => {
        await agg
        if(process.env[`SKIP_${current.tableName.toUpperCase()}`] === JSON.stringify(true)){
            console.log(`skipping ${current.tableName}`)
            return true;
        }
        console.log(`building boundries into ${current.tableName}`)
        await createBoundryTable(current)
        return true;
    }, Promise.resolve(true))
}