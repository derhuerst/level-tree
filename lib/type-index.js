'use strict'

const arrayIndex = /^\d+$/

const ARRAY = Symbol.for('arrray')
const OBJECT = Symbol.for('object')
const OTHER = Symbol.for('other')

// note: entries need to be in LevelDB reverse order for this to work!
const createTypeIndex = (db, ns, cb) => {
	const index = Object.create(null)

	const onEntry = (key) => {
		key = key.toString('utf8')
		index[key] = OTHER // leaves are always primitives

		const parts = key.split('.')
		for (let i = parts.length - 1; i > 0; i--) {
			const slice = parts.slice(0, i).join('.')
			const typeAt = arrayIndex.test(parts[i]) ? ARRAY : OBJECT
			index[slice] = typeAt
		}
	}

	const entries = db.createKeyStream({
		gt: ns + '.!',
		lt: ns + '.~',
		reverse: true // for efficient lookup
	})

	entries.on('data', onEntry)
	entries.once('end', () => {
		cb(null, index)
	})
	entries.once('error', (err) => {
		entries.destroy()
		cb(err)
	})
}

createTypeIndex.arrayIndex = arrayIndex
createTypeIndex.ARRAY = ARRAY
createTypeIndex.OBJECT = OBJECT
createTypeIndex.OTHER = OTHER

module.exports = createTypeIndex
