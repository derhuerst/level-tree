'use strict'

const eachSeries = require('async/eachSeries')

const createTypeIndex = require('./lib/type-index')
const {arrayIndex, ARRAY, OBJECT, OTHER} = createTypeIndex

// applies a JSON patch to a level-tree
// see http://jsonpatch.com
const createPatch = (db) => {
	const applyAll = (ns, patches, cb) => {
		createTypeIndex(db, ns, (err, typeAt) => {
			if (err) return cb(err)
			const ops = []

			const apply = (patch, cb) => {
				const path = patch.path.split('/').slice(1)
				path.unshift(ns)

				// todo
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
