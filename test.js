'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const test = require('tape')

const createGet = require('./get')
const createPut = require('./put')
const createDel = require('./del')

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

		get('tree', (err, tree) => {
			t.ok(err)
			t.equal(err.message, 'a2 is blocked')
			t.notOk(tree)
		})
	})
})

test('put writes to db correctly', (t) => {
	const expected = [
		{key: 'example.a1', value: 'A1'},
		{key: 'example.a2.b1', value: 'A2-B1'},
		{key: 'example.a2.b2.c1', value: 'A2-B2-C1'},
		{key: 'example.a3', value: 'A3'}
	]
	t.plan(2 + expected.length)

	const db = levelup(memdown)
	const put = createPut(db)

	t.equal(typeof put, 'function')
	t.equal(put.length, 3)

	put('example', {
		a1: 'A1',
		a2: {
			b1: 'A2-B1',
			b2: {
				c1: 'A2-B2-C1'
			}
		},
		a3: 'A3'
	}, (err) => {
		if (err) return onErr(err)

		let dataI = 0
		db.createReadStream()
		.once('error', t.ifError)
		.on('data', (data) => {
			const i = dataI++
			t.deepEqual(data, expected[i], i + ' looks good')
		})
	})
})

test('del deletes from db correctly', (t) => {
	const expected = [
		{key: 'tree.a1', value: 'A1'},
		{key: 'tree.a2', value: 'not to be deleted'},
		{key: 'tree.a2-b1', value: 'not to be deleted'},
		{key: 'tree.a3', value: 'A3'}
	]
	t.plan(2 + expected.length)
	const db = levelup(memdown)
	const del = createDel(db)

	t.equal(typeof del, 'function')
	t.equal(del.length, 3)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.b1', 'A2-B1')
		.put('tree.a2', 'not to be deleted')
		.put('tree.a2-b1', 'not to be deleted')
		.put('tree.a2.b2.c1', 'A2-B2-C1')
		.put('tree.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a2', (err) => {
			if (err) return t.ifError(err)

			let dataI = 0
			db.createReadStream()
			.once('error', t.ifError)
			.on('data', (data) => {
				const i = dataI++
				t.deepEqual(data, expected[i], i + ' looks good')
			})
		})
	})
})

test('del dry run works', (t) => {
	t.plan(1)
	const db = levelup(memdown)
	const del = createDel(db)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.b1', 'A2-B1')
		.put('tree.a2', 'not to be deleted')
		.put('tree.a2-b1', 'not to be deleted')
		.put('tree.a2.b2.c1', 'A2-B2-C1')
		.put('tree.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a2', true, (err, ops) => {
			if (err) return t.ifError(err)

			t.deepEqual(ops, [
				{type: 'del', key: 'tree.a2.b1'},
				{type: 'del', key: 'tree.a2.b2.c1'}
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
	const db = levelup(memdown)
	const del = createDel(db)

	db.batch()
		.put('tree.a1', 'A1')
		.put('tree.a2.b1', 'A2-B1')
		.put('tree.a2.b2', 'A2-B2')
	.write((err) => {
		if (err) return t.ifError(err)

		del('tree.a1', (err) => {
			if (err) return t.ifError(err)

			let dataI = 0
			db.createReadStream()
			.once('error', t.ifError)
			.on('data', (data) => {
				const i = dataI++
				t.deepEqual(data, expected[i], i + ' looks good')
			})
		})
	})
})
