'use strict'

const levelup = require('levelup')
const memdown = require('memdown')

const createDb = () => {
	const path = Math.random().toString(16).slice(2)
	return levelup(memdown(path))
}

const dbLooksLike = (t, db, expected) => {
	let i = 0
	db.createReadStream()
	.once('error', t.ifError)
	.on('data', (data) => {
		t.deepEqual({
			key: data.key.toString('utf8'),
			value: data.value.toString('utf8')
		}, expected[i], i + ' looks good')
		i++
	})
}

module.exports = {createDb, dbLooksLike}
