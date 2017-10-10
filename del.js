'use strict'

const createDel = (db) => {
	const del = (ns, dryRun, cb) => {
		if ('function' === typeof dryRun) {
			cb = dryRun
			dryRun = false
		}

		const slice = {gt: ns + '.!', lt: ns + '.~'}
		const ops = []

		const onEntry = (key) => {
			ops.push({
				type: 'del',
				key: key.toString('utf8')
			})
		}

		const run = () => {
			if (ops.length === 0) { // no children, try to delete root
				ops.push({type: 'del', key: ns})
			}

			if (dryRun) cb(null, ops)
			else db.batch(ops, cb)
		}

		const onError = (err) => {
			entries.destroy()
			cb(err)
		}

		const entries = db.createKeyStream(slice)
		entries.on('data', onEntry)
		entries.once('end', run)
		entries.once('error', onError)
	}

	return del
}

module.exports = createDel
