'use strict'

const levelup = require('levelup')
const memdown = require('memdown')
const test = require('tape')
const sortBy = require('lodash.sortby')

const createPatch = require('../patch')
const {typeAt, ARRAY, OBJECT, OTHER} = createPatch

test('patch', (t) => {
	t.plan(2)
	const db = levelup(memdown)
	const patch = createPatch(db)

	t.equal(typeof patch, 'function')
	t.equal(patch.length, 2)
})

test.only('patch: add works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a2.0', value: 'A2-0'},
		{key: 't.a2.1.b1', value: 'A2-1-B1'},
		{key: 't.a2.1.b2', value: 'new A2-1-B2'},
		{key: 't.a2.2', value: 'new A2-2'},
		{key: 't.a3', value: 'A3'},
		{key: 't.a4', value: 'new A4'}
	], 'key')
	t.plan(expected.length)

	const db = levelup(memdown)
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'add', path: '/a2/2', value: 'new A2-1-B2'}, // add in arr
			{op: 'add', path: '/a2/1/b2', value: 'new A2-1-B2'}, // add in obj in arr
			{op: 'add', path: '/a4', value: 'new A4'} // add in obj
		], (err) => {
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

test('patch checks for conflicts', (t) => {
	t.plan(2)

	const db = levelup(memdown)
	const patch = createPatch(db)

	db.batch()
		.put('t.a1.0', 'A1-0')
		// todo: other conflicts
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'add', path: '/a1/b1', value: 'A1-B1'} // obj key, but arr tree
		], (err) => {
			t.ok(err)
			t.equal(err.message, 'conflict at /a1/b1')
		})
	})
})

test.skip('patch: typeAt helper', (t) => {
	const entries = [
		{key: 'tree.a2.1.b1',	value: 'A2-2-B1'},
		{key: 'tree.a2.0',		value: 'A2-1'},
		{key: 'tree.a1',		value: 'A1'}
	]

	t.equal(typeAt(entries, ['tree']), OBJECT)
	t.equal(typeAt(entries, ['tree', 'a1']), OTHER)
	t.equal(typeAt(entries, ['tree', 'a2']), ARRAY)
	t.equal(typeAt(entries, ['tree', 'a2', '1']), OBJECT)
	t.equal(typeAt(entries, ['tree', 'a2', '1', 'b1']), OTHER)
	t.end()
})
