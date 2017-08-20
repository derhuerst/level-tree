'use strict'

const createGet = require('./get')

const createTree = (db) => ({
	get: createGet(db)
})

module.exports = createTree
