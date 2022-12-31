import { sock, store } from './labels-sock'


export const getLabels = () => store.labels
export const setLabels = async(chats: string[], labels: string[]) => {
	for(const chat of chats) {
		for(const label of labels) {
			await sock.chatModify({ addLabel: { label } }, chat)
		}
	}
}
