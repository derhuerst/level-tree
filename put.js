'use strict'

const createPut = (db) => {
	const put = (ns, tree, dryRun, cb) => {
		if ('function' === typeof dryRun) {
			cb = dryRun
			dryRun = false
		}

		const ops = []

		const stack = [[ns + '.', tree]] // add root
		while (stack.length > 0) {
			const [prefix, subtree] = stack.pop()

			const isArray = Array.isArray(subtree)
			for (let k of Object.keys(subtree)) {
				if (isArray) k = parseInt(k)
				const val = subtree[k]

				if (val && 'object' === typeof val) { // object
					stack.push([prefix + k + '.', val])
				} else {
					ops.push({type: 'put', key: prefix + k, value: val})
				}
			}
		}

		if (dryRun) cb(null, ops)
		else db.batch(ops, cb)
	}

	return put
}

module.exports = createPut
