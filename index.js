'use strict'

const createGet = require('./get')
const createPut = require('./put')

const createTree = (db) => ({
	get: createGet(db),
	put: createPut(db)
})

module.exports = createTree
