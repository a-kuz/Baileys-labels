import { Boom } from '@hapi/boom'
import { log } from 'console'
import P from 'pino'
import makeWASocket, {
	DisconnectReason,
	makeCacheableSignalKeyStore,
	makeInMemoryStore,
	useMultiFileAuthState,
	WASocket
} from '../../src'

const logger = P({ transport: { target: 'pino-pretty' } })
logger.level = 'info'
export let sock: WASocket

export const store = makeInMemoryStore({ logger })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store_multi.json')
}, 10_000)

const startSock = async() => {
	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

	const sock = makeWASocket({
		logger,
		printQRInTerminal: true,
		auth: {
			creds: state.creds,
			/** caching makes the store faster to send/recv messages */
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
	})

	store.bind(sock.ev)

	sock.ev.process(
		// events is a map for event name => event data
		async(events) => {
			// something about the connection changed
			// maybe it closed, or we received all offline message or connection opened
			if(events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect } = update
				if(connection === 'close') {
					// reconnect if not logged out
					if(
						(lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut
					) {
						startSock()
					} else {
						logger.info('Connection closed. You are logged out.')
					}
				}
			}

			// credentials updated -- save them
			if(events['creds.update']) {
				await saveCreds()
			}

			if(events['labelAssociation.set']) {
				const associations = store.labelAssociations
				log(JSON.stringify({ associations }, null))
			}

			if(events['labels.upsert']) {
				const labels = store.labels
				logger.info(JSON.stringify({ labels }, null, 2))
			}
		},
	)

	return sock
}

startSock()


