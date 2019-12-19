export enum NyDataTableName {
    complaints = 'nypd_complaints',
    sectors = 'nypd_sectors',
    communityDistricts = 'community_disctricts',
}
export const allNyDataTableNames: ReadonlyArray<NyDataTableName> = [
    NyDataTableName.complaints, NyDataTableName.sectors
]

export type DataSetConfig  = Readonly<{
    id: string
    description: string,
    tableName: NyDataTableName,
    primaryKey: string,
  }>

export const dataSets: ReadonlyArray<DataSetConfig> = [
    {
      description: 'Nypd Complaints',
      id: 'qgea-i56i',
      tableName: NyDataTableName.complaints,
      primaryKey: 'cmplnt_num'
    },
    {
      description: 'Nypd Sectors',
      id: '5rqd-h5ci',
      tableName: NyDataTableName.sectors,
      primaryKey: 'sector'
    },
    {
      description: 'Community Districts',
      id: 'jp9i-3b7y',
      tableName: NyDataTableName.communityDistricts,
      primaryKey: 'boro_cd'
    }
  ]