import {Client, QueryResult, } from 'pg';

export enum NypdTables {
    complaints = 'nypd_complaints'
}

export type DbAccess = Readonly<{
    query: (query: string, values? : (string|null)[]) => Promise<QueryResult>;
    queryNamed: (name: string, query: string, values? : (string|null)[]) => Promise<QueryResult>;
    end: () => Promise<void>;
}>

export const connect = async (): Promise<DbAccess> => {
  const client = new Client({
    host: process.env.NYC_DATA_DB_HOST,
    port: 5432,
    user: process.env.NYC_DATA_DB_USER,
    password: process.env.NYC_DATA_DB_PASSWORD,
    database: 'postgres',
  });
  console.log('connecting...');
  await client.connect();
  console.log('done.');
  return {
    query: (query: string, values?: (string|null)[]): Promise<QueryResult> => client.query(query, values),
    queryNamed: (name: string, text: string, values?: (string|null)[]): Promise<QueryResult> => client.query({name, text, values}),
    end: (): Promise<void> => client.end(),
  };
};
