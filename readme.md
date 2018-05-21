# level-tree

**Store trees in a [LevelDB](https://github.com/level/levelup).**

[![npm version](https://img.shields.io/npm/v/@derhuerst/level-tree.svg)](https://www.npmjs.com/package/@derhuerst/level-tree)
[![build status](https://img.shields.io/travis/derhuerst/level-tree.svg)](https://travis-ci.org/derhuerst/level-tree)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/level-tree.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install @derhuerst/level-tree
```


## Usage

```js
const levelTree = require('@derhuerst/level-tree')

const db = levelup(memdown)
const tree = levelTree(db)

tree.put('example', {
	a1: 'A1',
	a2: [
		'A2-0',
		{
			b1: 'A2-1-B1'
		}
	]
}, (err) => {
	if (err) return console.error(err)

	db.put('example.a2.0', 'a new value', (err) => {
		if (err) return console.error(err)

		tree.get('example', (err, example) => {
			if (err) return console.error(err)

			console.log(example)
		})
	})
})
```

```js
{
	a1: 'A1',
	a2: [
		'a new value',
		{
			b1: 'A2-1-B1'
		}
	]
}
```

You can also load `get`, `put` & `del` separately:

```js
const createGet = require('@derhuerst/level-tree/get')
const createPut = require('@derhuerst/level-tree/put')
const createDel = require('@derhuerst/level-tree/del')

const get = createGet(db)
const put = createPut(db)
const del = createDel(db)
```

### patches

`level-tree` can apply [*JSON Patch*](http://jsonpatch.com/) diffs to the tree. Using the `db` from above:

```js
const createPatch = require('@derhuerst/level-tree/patch')
const patch = createPatch(db)

patch('example', [
	{op: 'move', path: '/a3', from: '/a2/1'}
], (err) => {
	if (err) return console.error(err)

	tree.get('example', (err, example) => {
		if (err) return console.error(err)

		console.log(example)
	})
})
```

```js
{
	a1: 'A1',
	a2: [
		'a new value'
	],
	a3: {
		b1: 'A2-1-B1'
	}
}
```


## API

```js
const tree = createTree(db)
```

`db` must be a [levelup](https://www.npmjs.com/package/levelup)-compatible database.

## `tree.get(namespace, cb)`

Will try to infer the tree from all keys starting with `namespace`.

## `tree.put(namespace, [dryRun], data, cb)`

If `dryRun` is `true`, `cb` will be called with all [ops](https://www.npmjs.com/package/levelup#batch) to be executed. Otherwise, they will be executed.

## `tree.del(namespace, [dryRun], cb)`

If `dryRun` is `true`, `cb` will be called with all [ops](https://www.npmjs.com/package/levelup#batch) to be executed. Otherwise, they will be executed.

If it fails to find any chilren under `namespace`, it will try to delete at `namespace` itself (the root so to say) as well.


## Contributing

If you have a question or have difficulties using `level-tree`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/level-tree/issues).
