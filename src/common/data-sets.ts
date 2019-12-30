import { readFile } from "fs-extra"


export const getDataSetConfigs = async () => {
  return JSON.parse(await readFile("./configs/data-set-config.json", "UTF-8")) as readonly DataSetConfig[]
}

export type ColCorrection = Readonly<{
  from: string,
  to: string,
}>
export type DataSource = Readonly<{
  id: string,
  fileName: string,
  colNameCorrections: readonly ColCorrection[],
}>
export type DataSetConfig  = Readonly<{
  description: string,
  tableName: string,
  primaryKey?: string,
  isKeyGenerated?: boolean,
  sources: readonly DataSource[]
}>