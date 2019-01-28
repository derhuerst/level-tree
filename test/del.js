'use strict'

const test = require('tape')

const {createDb, dbLooksLike} = require('./lib')
const createDel = require('../del')

test('del deletes from db correctly', (t) => {
	const expected = [
		{key: 'tree.a1', value: 'A1'},
		{key: 'tree.a2', value: 'not to be deleted'},
		{key: 'tree.a2-1', value: 'not to be deleted'},
		{key: 'tree.a3', value: 'A3'}
	]
	t.plan(2 + expected.length)
	const db = createDb()
	const del = createDel(db)

	t.equal(typeof del, 'function')
	t.equal(del.length, 3)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.0', 'A2-1')
		.put('tree.a2', 'not to be deleted')
		.put('tree.a2-1', 'not to be deleted')
		.put('tree.a2.1.b1', 'A2-2-B1')
		.put('tree.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a2', (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('del dry run works', (t) => {
	t.plan(1)
	const db = createDb()
	const del = createDel(db)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.0', 'A2-1')
		.put('tree.a2', 'not to be deleted')
		.put('tree.a2-1', 'not to be deleted')
		.put('tree.a2.1.b1', 'A2-2-B1')
		.put('tree.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a2', true, (err, ops) => {
			if (err) return t.ifError(err)

			t.deepEqual(ops, [
				{type: 'del', key: 'tree.a2.0'},
				{type: 'del', key: 'tree.a2.1.b1'}
			])
		})
	})
})

test('del deletes root when no children', (t) => {
	const expected = [
		{key: 'tree.a2.b1', value: 'A2-B1'},
		{key: 'tree.a2.b2', value: 'A2-B2'}
	]
	t.plan(expected.length)
	const db = createDb()
	const del = createDel(db)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.b1', 'A2-B1')
		.put('tree.a2.b2', 'A2-B2')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a1', (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})
