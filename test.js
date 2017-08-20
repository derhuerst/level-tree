'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const test = require('tape')

const createGet = require('./get')

test('get reads from db correctly', (t) => {
	t.plan(3)
	const db = levelup(memdown)
	const get = createGet(db)

	t.equal(typeof get, 'function')
	t.equal(get.length, 2)

	db.batch()
		.put('tree.a1', 'val A1')
		.put('tree.a2.b1', 'val A2-B1')
		.put('tree.a2.b2.c1', 'val A2-B2-C1')
		.put('tree.a3', 'val A3')
	.write((err) => {
		if (err) return t.ifError(err)

		get('tree', (err, tree) => {
			if (err) return t.ifError(err)

			t.deepEqual(tree, {
				a1: 'val A1',
				a2: {
					b1: 'val A2-B1',
					b2: {
						c1: 'val A2-B2-C1'
					}
				},
				a3: 'val A3'
			})
		})
	})
})

test('get ignores noise', (t) => {
	t.plan(1)
	const db = levelup(memdown)
	const get = createGet(db)

	db.batch()
		.put('tree.a1', 'val A1')
		.put('noise', 'to be ignored')
		.put('tree.a2.b1', 'val A2-B1')
		.put('tree-noise', 'to be ignored')
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
	const db = levelup(memdown)
	const get = createGet(db)

	db.batch()
		.put('tree.a1', 'val A1')
		.put('tree.a2', 'i am blocking')
		.put('tree.a2.b1', 'val A2-B1')
	.write((err) => {
		if (err) return t.ifError(err)

		get('_', (err, tree) => {
			t.ok(err)
			t.equal(err.message, 'a2 is blocked')
			t.notOk(tree)
		})
	})
})
