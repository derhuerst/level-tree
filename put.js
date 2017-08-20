'use strict'

const createPut = (db) => {
	const put = (ns, tree, cb) => {
		const ops = []

		const stack = [[ns + '.', tree]] // add root
		while (stack.length > 0) {
			const [prefix, subtree] = stack.pop()
			for (let k of Object.keys(subtree)) {
				const val = subtree[k]
				if (val && 'object' === typeof val && !Array.isArray(val)) { // object
					stack.push([prefix + k + '.', val])
				} else {
					ops.push({type: 'put', key: prefix + k, value: val})
				}
			}
		}

		db.batch(ops, cb)
	}

	return put
}

module.exports = createPut
