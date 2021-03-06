'use strict'

const test = require('tape')
const sortBy = require('lodash.sortby')

const {createDb, dbLooksLike} = require('./lib')
const createPatch = require('../patch')

test('patch', (t) => {
	t.plan(2)
	const db = createDb()
	const patch = createPatch(db)

	t.equal(typeof patch, 'function')
	t.equal(patch.length, 4)
})

test('patch: add works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a2.0', value: 'A2-0'},
		{key: 't.a2.1.b1', value: 'A2-1-B1'},
		{key: 't.a2.1.b2', value: 'new A2-1-B2'},
		{key: 't.a2.2', value: 'new A2-2'},
		{key: 't.a3', value: 'A3'},
		{key: 't.a4', value: 'new A4'},
		{key: 't.a5.b1', value: 'new A5-B1'},
		{key: 't.a5.b3', value: 'new A5-B3'}
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'add', path: '/a2/2', value: 'new A2-2'}, // add in arr
			{op: 'add', path: '/a2/1/b2', value: 'new A2-1-B2'}, // add in obj in arr
			{op: 'add', path: '/a4', value: 'new A4'}, // add in obj
			{op: 'add', path: '/a5', value: {
				b1: 'new A5-B1',
				b3: 'new A5-B3'
			}}
		], (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('patch: remove works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a3', value: 'A3'}
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'remove', path: '/a2'}
		], (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('patch: copy works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a2.0', value: 'A2-0'},
		{key: 't.a2.1.b1', value: 'A2-1-B1'},
		{key: 't.a2.1.b2', value: 'A2-1-B2'},
		{key: 't.a3', value: 'A3'},
		{key: 't.a4.b1', value: 'A2-1-B1'}, // note the value
		{key: 't.a4.b2', value: 'A2-1-B2'}, // note the value
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a2.1.b2', 'A2-1-B2')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'copy', path: '/a4', from: '/a2/1'}
		], (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('patch: test works', (t) => {
	t.plan(2 + 1)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'test', path: '/a4'} // does not exist
		], (err) => {
			t.ok(err)
			if (err) t.equal(err.message, '/a4 does not exist')
		})

		patch('t', [
			{op: 'test', path: '/a1'},
			{op: 'test', path: '/a2.1'},
			{op: 'test', path: '/a2.1.b1'}
		], (err) => {
			t.notOk(err)
			if (err) t.ifError(err)
		})
	})
})

test('patch: move works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a2.0', value: 'A2-0'},
		{key: 't.a3', value: 'A3'},
		{key: 't.a4.b1', value: 'A2-1-B1'}, // note the value
		{key: 't.a4.b2', value: 'A2-1-B2'}, // note the value
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a2.1.b2', 'A2-1-B2')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'move', path: '/a4', from: '/a2/1'}
		], (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('patch: replace works', (t) => {
	const expected = sortBy([
		{key: 't.a1', value: 'A1'},
		{key: 't.a2.0', value: 'A2-0'},
		{key: 't.a2.1.0', value: 'A2-1-0'},
		{key: 't.a2.1.1', value: 'A2-1-1'},
		{key: 't.a3', value: 'A3'}
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a2.1.b2', 'A2-1-B2')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'replace', path: '/a2.1', value: ['A2-1-0', 'A2-1-1']}
		], (err) => {
			if (err) return t.ifError(err)

			dbLooksLike(t, db, expected)
		})
	})
})

test('patch: dryRun works', (t) => {
	t.plan(1)

	const db = createDb()
	const patch = createPatch(db)

	db.batch()
		.put('t.a1', 'A1')
		.put('t.a2.0', 'A2-0')
		.put('t.a2.1.b1', 'A2-1-B1')
		.put('t.a3', 'A3')
	.write((err) => {
		if (err) return t.ifError(err)

		patch('t', [
			{op: 'add', path: '/a4', value: 'new A4'}
		], true, (err, ops) => {
			if (err) return t.ifError(err)

			t.deepEqual(ops, [
				{type: 'put', key: 't.a4', value: 'new A4'}
			])
		})
	})
})

test('patch checks for conflicts', (t) => {
	t.plan(2 * 2)

	const db = createDb()
	const apply = createPatch(db)

	db.batch()
		.put('t.a1.0', 'A1-0')
		.put('t.a2.b1', 'A2-B1')
		// todo: other conflicts
	.write((err) => {
		if (err) return t.ifError(err)

		const expectErr = (patch, msg) => {
			apply('t', [patch], (err) => {
				t.ok(err)
				if (err) t.equal(err.message, msg)
			})
		}

		expectErr({ // obj key, but arr tree
			op: 'add', path: '/a1/b1', value: 'A1-B1'
		}, 'conflict at /a1/b1')
		expectErr({ // arr key, but obj tree
			op: 'add', path: '/a2/0', value: 'A2-0'
		}, 'conflict at /a2/0')
	})
})
