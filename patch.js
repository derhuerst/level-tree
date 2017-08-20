'use strict'

const eachSeries = require('async/eachSeries')

const createTypeIndex = require('./lib/type-index')
const {arrayIndex, ARRAY, OBJECT, OTHER} = createTypeIndex

// applies a JSON patch to a level-tree
// see http://jsonpatch.com
const createPatch = (db) => {
	const ops = []

	const applyAll = (ns, patches, cb) => {
		createTypeIndex(db, ns, (err, typeAt) => {
			if (err) return cb(err)

			const apply = (patch, cb) => {
				const path = patch.path.split('/').slice(1)
				path.unshift(ns)
				const last = path[path.length - 1]

				if (patch.op === 'add') {
					// check if there is an existing conflicting leaf
					const existingType = typeAt[path.slice(0, -1).join('.')] // without leaf
					const newType = arrayIndex.test(last) ? ARRAY : OBJECT
					if (existingType !== newType) {
						// todo: more helpful message
						return cb(new Error('conflict at ' + patch.path))
					}

					ops.push({type: 'put', key: path.join('.'), value: patch.value})
					cb()
				} else {
					// todo: replace, remove, copy, move, test
					return cb(new Error('unsupported patch op:' + patch.op))
				}
			}

			eachSeries(patches, apply, (err) => {
				if (err) return cb(err)

				db.batch(ops, cb) // todo: dryRun
			})
		})
	}

	return applyAll
}

module.exports = createPatch
