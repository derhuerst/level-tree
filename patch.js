'use strict'

const eachSeries = require('async/eachSeries')

const arrayIndex = /^\d+$/

const getEntries = (db, ns, cb) => {
	const keys = []
	const entries = db.createReadStream({
		gt: ns + '.!',
		lt: ns + '.~',
		reverse: true // for efficient lookup by typeAt
	})

	entries.on('data', (entry) => {
		keys.push(entry)
	})
	entries.once('end', () => {
		cb(null, keys)
	})
	entries.once('error', (err) => {
		entries.destroy()
		cb(err)
	})
}

const ARRAY = Symbol.for('arrray')
const OBJECT = Symbol.for('object')
const OTHER = Symbol.for('other')

// todo: optimize by moving preprocessing from typeAt to getEntries
// todo: create a more efficient key index, e.g. using
// mikolalysenko/functional-red-black-tree
// note: entries needs to be in LevelDB reverse order for this to work!
const typeAt = (entries, path) => {
	const joined = path.join('.')

	const slices = Object.create(null)
	for (let i = path.length; i > 0; i--) {
		const slice = path.slice(0, i).join('.')
		slices[slice] = true
	}

	for (let entry of entries) { // match exactly
		if (entry.key === joined) return OTHER
	}

	for (let entry of entries) { // match by looking for key slices
		const parts = entry.key.split('.')
		for (let i = parts.length - 1; i > 0; i--) {
			const slice = parts.slice(0, i).join('.')

			if (slice in slices) {
				return arrayIndex.test(parts[i]) ? ARRAY : OBJECT
			}
		}
	}
}

// applies a JSON patch to a level-tree
// see http://jsonpatch.com
const createPatch = (db) => {
	const applyAll = (ns, patches, cb) => {
		getEntries(db, ns, (err, entries) => {
			if (err) return cb(err)
			const ops = []

			const apply = (patch, cb) => {
				const path = patch.path.split('/').slice(1)
				path.unshift(ns)

				// todo
			}

			eachSeries(patches, apply, (err) => {
				if (err) return cb(err)
				console.error('ops', ops)
				db.batch(ops, cb) // todo: dryRun
			})
		})
	}

	return applyAll
}

createPatch.ARRAY = ARRAY
createPatch.OBJECT = OBJECT
createPatch.OTHER = OTHER
createPatch.typeAt = typeAt

module.exports = createPatch
