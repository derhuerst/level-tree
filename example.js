'use strict'

const levelup = require('levelup')
const memdown = require('memdown')

const levelTree = require('.')

const onErr = (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
}

const db = levelup(memdown)

db.batch()
	.put('example.a1', 'hey')
	.put('example.a2.b1', 'there!')
	.put('example.a2.b2.c1', 'this')
	.put('example.a3', 'is a tree')
	.put('example-noise', 'this does not belong in the tree!')
.write((err) => {
	if (err) return onErr(err)

	const tree = levelTree(db)
	tree.get('example', (err, t) => {
		if (err) return onErr(err)

		console.log(t)
	})
})
