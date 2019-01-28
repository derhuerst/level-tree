'use strict'

const test = require('tape')

const {createDb} = require('./lib')
const createTypeIndex = require('../lib/type-index')
const {typeAt, ARRAY, OBJECT, OTHER} = createTypeIndex

test('type index works', (t) => {
	t.plan(1)
	const db = createDb()

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.0', 'A2-0')
		.put('tree.a2.1.b1.c1', 'A2-1-B1-C1')
	.write((err) => {
		if (err) return t.ifError(err)

		createTypeIndex(db, 'tree', (err, index) => {
			if (err) return t.ifError(err)

			t.deepEqual(index, {
				'tree': OBJECT,
				'tree.a1': OTHER,
				'tree.a2': ARRAY,
				'tree.a2.0': OTHER,
				'tree.a2.1': OBJECT,
				'tree.a2.1.b1': OBJECT,
				'tree.a2.1.b1.c1': OTHER
			})
		})
	})
})
