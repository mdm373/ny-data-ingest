import { ingestCsv, IngestConfig } from "./ingest-csv"
import { getDataSetConfigs } from "../common/data-sets"
import { ensureDir, pathExists } from "fs-extra"
import { exec, spawn } from "child_process"

export const handler = async () => {
    const dataConfig = await getDataSetConfigs()
    await ensureDir("./.dat")
    await dataConfig.reduce(async (agg, current) => {
        await agg
        await current.sources.reduce(async (aggSource, currentSource) => {
            await aggSource
            if(!await pathExists(`./.dat/${currentSource.fileName}.csv`)){
                await new Promise((resolve, reject) => {
                    const spawned = spawn(`./scripts/download-from.sh ${currentSource.fileName} ${currentSource.id}`, {stdio: 'inherit', shell: true});
                    spawned.on("exit", () => resolve(true))
                    spawned.on("error", (error) => reject(error))
                })
            }
            return true
        }, Promise.resolve(true))
        return true
    }, Promise.resolve(true))

    const configs: readonly IngestConfig[] = (dataConfig).reduce((configAgg, configCurrent) =>
        configAgg.concat(configCurrent.sources.reduce((sourceAgg, currentSource) => {
            sourceAgg.push({
                tableName: configCurrent.tableName,
                filename: `./.dat/${currentSource.fileName}.csv`,
                colNameCorrections : currentSource.colNameCorrections,
                isKeyGenerated : configCurrent.isKeyGenerated || false,
                primaryKey: configCurrent.primaryKey || "id",
            })
            return sourceAgg
        }, [] as IngestConfig[]))
    , [] as IngestConfig[])
    configs.reduce(async (agg, current) => {
        await agg
        await ingestCsv(current)
        return true
    }, Promise.resolve(true))
}