'use strict'

const test = require('tape')

const {createDb} = require('./lib')
const createGet = require('../get')

test('get reads from db correctly', (t) => {
	t.plan(2 + 3)
	const db = createDb()
	const get = createGet(db)

	t.equal(typeof get, 'function')
	t.equal(get.length, 2)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.0', 'A2-1')
		.put('tree.a2.1.b1', 'A2-2-B1')
		.put('tree.a2.2.b1', 'A2-3-B1')
		.put('tree.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		get('tree', (err, tree) => {
			if (err) return t.ifError(err)
			t.deepEqual(tree, {
				a1: 'A1',
				a2: [
					'A2-1',
					{b1: 'A2-2-B1'},
					{b1: 'A2-3-B1'}
				],
				a3: 'A3'
			})
		})

		get('tree.a2', (err, tree) => {
			if (err) return t.ifError(err)
			t.deepEqual(tree, [
				'A2-1',
				{b1: 'A2-2-B1'},
				{b1: 'A2-3-B1'}
			])
		})

		get('tree.a2.1', (err, tree) => {
			if (err) return t.ifError(err)
			t.deepEqual(tree, {b1: 'A2-2-B1'})
		})
	})
})

test('get ignores noise', (t) => {
	t.plan(1)
	const db = createDb()
	const get = createGet(db)

	db.batch()
		.put('tree.a1', 'val A1')
		.put('noise', 'to be ignored')
		.put('tree.a2.b1', 'val A2-B1')
		.put('tree-1', 'to be ignored')
	.write((err) => {
		if (err) return t.ifError(err)

		get('tree', (err, tree) => {
			if (err) return t.ifError(err)

			t.deepEqual(tree, {
				a1: 'val A1',
				a2: {
					b1: 'val A2-B1'
				}
			})
		})
	})
})

test('get throws on conflicts', (t) => {
	t.plan(3)
	const db = createDb()
	const get = createGet(db)

	db.batch()
		.put('tree.a1', 'val A1')
		.put('tree.a2', 'i am blocking')
		.put('tree.a2.b1', 'val A2-B1')
	.write((err) => {
		if (err) return t.ifError(err)

		get('tree', (err, tree) => {
			t.ok(err)
			t.equal(err.message, 'tree.a2 is blocked by a primitive value')
			t.notOk(tree)
		})
	})
})
