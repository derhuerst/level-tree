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

			const assertNoConflict = (base, key) => {
				// check if there is an existing conflicting leaf
				const newType = arrayIndex.test(key) ? ARRAY : OBJECT
				if (typeAt[base.join('.')] !== newType) {
					// todo: more helpful message
					const path = base.slice(1)
					path.push(key)
					throw new Error('conflict at /' + path.join('/'))
				}
			}

			const apply = (patch, cb) => {
				const path = patch.path.split('/').slice(1)
				path.unshift(ns)
				const last = path[path.length - 1]
				const key = path.join('.')

				if (patch.op === 'test') {
					if (key in typeAt) cb()
					else cb(new Error(patch.path + ' does not exist'))
				} else if (patch.op === 'add') {
					const base = path.slice(0, -1) // without leaf
					try {
						assertNoConflict(base, last)
					} catch (err) {
						return cb(err)
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
					const base = path.slice(0, -1) // without leaf
					try {
						assertNoConflict(base, last)
					} catch (err) {
						return cb(err)
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
				} else if (patch.op === 'move') {
					const base = path.slice(0, -1) // without leaf
					try {
						assertNoConflict(base, last)
					} catch (err) {
						return cb(err)
					}

					let fromKey = patch.from.split('/').slice(1)
					fromKey.unshift(ns)
					fromKey = fromKey.join('.')

					get(fromKey, (err, tree) => {
						if (err) return cb(err)
						put(key, tree, true, (err, putOps) => {
							if (err) return cb(err)
							ops = ops.concat(putOps)
							del(fromKey, true, (err, delOps) => {
								if (err) return cb(err)
								ops = ops.concat(delOps)
								cb()
							})
						})
					})
				} else {
					// todo: replace
					return cb(new Error('unsupported patch op: ' + patch.op))
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
