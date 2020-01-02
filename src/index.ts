import { handler as createBoundries } from './create-boundries'
import {handler as createTables} from './create-tables'
import {handler as populateData} from './populate-data'
import { readFile } from 'fs-extra'
import {handler as createSeries} from './create-time-series'
type Handler = () => Promise<void>
type HandlerTable = Readonly<{[key: string]: Handler }>

const handlerTable: HandlerTable  = {
    "create-boundries": createBoundries,
    "create-tables": createTables,
    "populate-data": populateData,
    "create-series": createSeries,
};

const loadSecrets = async () => {
    const secrets = JSON.parse(await readFile("./.secret.json", "UTF-8"));
    Object.keys(secrets).forEach((key) => {
        process.env[key] = secrets[key]
    })
}

(async (): Promise<void> => {
    try {
        await loadSecrets();
        const handlerName = process.argv[2]
        if(!handlerName) {
            throw Error('handler name not provided')
        }
        const handler = handlerTable[handlerName.trim().toLowerCase()]
        if(!handler) {
            throw Error(`unknown handler ${handlerName}`)
        }
        console.log(`running handler ${handlerName}`)
        await handler()
        console.log('done.')
  }catch (err) {
      console.error('unexpected error running', err)
  }
})();
