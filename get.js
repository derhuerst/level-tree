'use strict'

const number = /^\d+$/
const EMPTY = {}
// const EMPTY = Symbol.for('empty')

const createGet = (db) => {
	const get = (ns, cb) => {
		const slice = {gt: ns + '.!', lt: ns + '.~'}
		const container = {[ns]: EMPTY}

		const onEntry = ({key: path, value}) => {
			const keys = path.split('.')
			let tree = container[ns]
			let parentTree = container

			const maxI = keys.length - 1
			for (let i = 1; i <= maxI; i++) { // skip first
				let pKey = keys[i - 1]
				let key = keys[i]
				if (pKey.length === 0 || key.length === 0) {
					throw new Error('path ' + path + ' contains empty parts')
				}

				const arrayKey = number.test(key)
				if (arrayKey) key = parseInt(key)
				const inArray = Array.isArray(tree)

				// we need to lazily create parent trees because we don't know before if they're
				// going to be array or object.
				if (tree === EMPTY) {
					const k = number.test(pKey) ? parseInt(pKey) : pKey
					const val = arrayKey ? [] : Object.create(null)
					parentTree[k] = val // create tree in parent tree
					tree = parentTree[k]
				}

				if (i === maxI) {
					tree[key] = value
				} else if (arrayKey && !inArray) {
					const k = keys.slice(0, i + 1).join('.')
					throw new Error(k + ': array key in non-array subtree')
				} else if (!arrayKey && inArray) {
					const k = keys.slice(0, i + 1).join('.')
					throw new Error(k + ': non-array key in array subtree')
				} else if (key in tree) {
					const isSubtree = 'object' === typeof tree[key]
					if (isSubtree) {
						parentTree = tree
						tree = tree[key]
					} else {
						const k = keys.slice(0, i + 1).join('.')
						throw new Error(k + ' is blocked by a primitive value')
					}
				} else {
					parentTree = tree
					tree[key] = EMPTY
					tree = tree[key]
				}
			}
		}

		const onError = (err) => {
			entries.destroy()
			cb(err)
		}

		const entries = db.createReadStream(slice)
		entries.on('data', (entry) => {
			try {
				onEntry(entry)
			} catch (err) {
				onError(err)
			}
		})
		entries.once('end', () => {
			cb(null, container[ns])
		})
		entries.once('error', onError)
	}

	return get
}

module.exports = createGet
