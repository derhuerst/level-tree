'use strict'

const test = require('tape')
const sortBy = require('lodash.sortby')

const {createDb, dbLooksLike} = require('./lib')
const createPut = require('../put')

test('put writes trees to db correctly', (t) => {
	const expected = sortBy([
		{key: 'example.a1', value: 'A1'},
		{key: 'example.a2.0', value: 'A2-1'},
		{key: 'example.a2.1.b1', value: 'A2-2-B1'},
		{key: 'example.a3', value: 'A3'}
	], 'key')
	t.plan(2 + expected.length)

	const db = createDb()
	const put = createPut(db)

	t.equal(typeof put, 'function')
	t.equal(put.length, 4)

	put('example', {
		a1: 'A1',
		a2: [
			'A2-1',
			{b1: 'A2-2-B1'}
		],
		a3: 'A3'
	}, (err) => {
		if (err) return onErr(err)

		dbLooksLike(t, db, expected)
	})
})

test('put writes primitives to db correctly', (t) => {
	const expected = sortBy([
		{key: 'example', value: 'hey!'}
	], 'key')
	t.plan(expected.length)

	const db = createDb()
	const put = createPut(db)

	put('example', 'hey!', (err) => {
		if (err) return onErr(err)

		dbLooksLike(t, db, expected)
	})
})

test('put dry run works', (t) => {
	t.plan(2)
	const db = createDb()
	const put = createPut(db)

	put('example', {
		a1: 'A1',
		a2: [
			'A2-1',
			{b1: 'A2-2-B1'}
		],
		a3: 'A3'
	}, true, (err, ops) => {
		if (err) return onErr(err)

		t.ok(Array.isArray(ops))
		t.deepEqual(sortBy(ops, 'key'), sortBy([
			{type: 'put', key: 'example.a1', value: 'A1'},
			{type: 'put', key: 'example.a2.0', value: 'A2-1'},
			{type: 'put', key: 'example.a2.1.b1', value: 'A2-2-B1'},
			{type: 'put', key: 'example.a3', value: 'A3'}
		], 'key'))
	})
})
