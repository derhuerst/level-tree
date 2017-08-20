'use strict'

const createGet = (db) => {
	const get = (ns, cb) => {
		const slice = {gt: ns + '.!', lt: ns + '.~'}
		const tree = Object.create(null)

		const onEntry = ({key, value}) => {
			const parts = key.split('.')

			let subtree = tree
			const maxI = parts.length - 2 // exclude last
			for (let i = 1; i <= maxI; i++) { // begin at 1 because to skip ns
				const part = parts[i]
				if (!part) {
					onError(new Error('key ' + key + ' contains empty parts'))
					return
				}

				if (!(part in subtree)) { // key does not exist
					// create empty subtree, descend
					subtree = (subtree[part] = Object.create(null))
					continue
				}

				const val = subtree[part]
				// not an object, thus not extendable
				if (!val || 'object' !== typeof val || Array.isArray(val)) {
					onError(new Error(parts.slice(1, i + 1).join('.') + ' is blocked'))
					return
				}

				subtree = val // descend
			}

			subtree[parts[maxI + 1]] = value
		}

		const onError = (err) => {
			entries.destroy()
			cb(err)
		}

		const entries = db.createReadStream(slice)
		entries.once('end', () => cb(null, tree))
		entries.once('error', onError)
		entries.on('data', onEntry)
	}

	return get
}

module.exports = createGet
