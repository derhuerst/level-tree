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
const tree = levelTree(db)

tree.put('example', {
	a1: 'A1',
	a2: [
		'A2-1',
		{b1: 'A2-2-B1'}
	],
	a3: 'A3'
}, (err) => {
	if (err) return onErr(err)

	db.batch()
		.put('example.a2.1.b1', 'a new value')
		.put('noise', 'does not belong to the tree')
	.write((err) => {
		if (err) return onErr(err)

		tree.get('example', (err, example) => {
			if (err) return onErr(err)

			console.log(example)
		})
	})
})
