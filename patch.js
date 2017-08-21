'use strict'

const eachSeries = require('async/eachSeries')

const createTypeIndex = require('./lib/type-index')
const createGet = require('./get')
const createPut = require('./put')
const createDel = require('./del')
const {arrayIndex, ARRAY, OBJECT, OTHER} = createTypeIndex

// applies a JSON patch to a level-tree
// see http://jsonpatch.com
const createPatch = (db) => {
	const get = createGet(db)
	const put = createPut(db)
	const del = createDel(db)

	const applyAll = (ns, patches, dryRun, cb) => {
		if ('function' === typeof dryRun) {
			cb = dryRun
			dryRun = false
		}
		let ops = []

		createTypeIndex(db, ns, (err, typeAt) => {
			if (err) return cb(err)

			const apply = (patch, cb) => {
				const path = patch.path.split('/').slice(1)
				path.unshift(ns)
				const last = path[path.length - 1]
				const key = path.join('.')

				if (patch.op === 'add') {
					// check if there is an existing conflicting leaf
					const existingType = typeAt[path.slice(0, -1).join('.')] // without leaf
					const newType = arrayIndex.test(last) ? ARRAY : OBJECT
					if (existingType !== newType) {
						// todo: more helpful message
						// todo: DRY with copy
						return cb(new Error('conflict at ' + patch.path))
					}

					ops.push({type: 'put', key, value: patch.value})
					cb()
				} else if (patch.op === 'remove') {
					// todo: optimize using the typeAt index
					del(key, true, (err, delOps) => {
						if (err) return cb(err)

						ops = ops.concat(delOps)
						cb()
					})
				} else if (patch.op === 'copy') {
					// check if there is an existing conflicting leaf
					const existingType = typeAt[path.slice(0, -1).join('.')] // without leaf
					const newType = arrayIndex.test(last) ? ARRAY : OBJECT
					if (existingType !== newType) {
						// todo: more helpful message
						// todo: DRY with add
						return cb(new Error('conflict at ' + patch.path))
					}

					const from = patch.from.split('/').slice(1)
					from.unshift(ns)

					get(from.join('.'), (err, tree) => {
						if (err) return cb(err)
						put(key, tree, true, (err, putOps) => {
							if (err) return cb(err)
							ops = ops.concat(putOps)
							cb()
						})
					})
				} else {
					// todo: replace, remove, copy, move, test
					return cb(new Error('unsupported patch op:' + patch.op))
				}
			}

			eachSeries(patches, apply, (err) => {
				if (err) return cb(err)

				if (dryRun) cb(null, ops)
				else db.batch(ops, cb)
			})
		})
	}

	return applyAll
}

module.exports = createPatch
