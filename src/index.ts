import { handler as createPrecincts } from './create-precincts'
import {handler as createTables} from './create-tables'
import {handler as populateData} from './populate-data'
import {loadSecrets} from './load-secrets';

type Handler = () => Promise<void>
type HandlerTable = Readonly<{[key: string]: Handler }>

const handlerTable: HandlerTable  = {
    "create-precincts": createPrecincts,
    "create-tables": createTables,
    "populate-data": populateData
};

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
