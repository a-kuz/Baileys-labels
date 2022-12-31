import { setLabels } from './labels/label-simple-api'
import { sock } from './labels/labels-sock'

export const setLabelsExample = async() => setLabels(['2', '3'], ['79384518299@s.whatsapp.net'])
export const removeLAbelsExample = async() => sock.chatModify(
	{
		removeLabel: {
			label: '1',
		},
	},
	'79384518299@s.whatsapp.net'
)

