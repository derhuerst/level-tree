# level-tree

**Store trees in a [LevelDB](https://github.com/level/levelup).**

[![npm version](https://img.shields.io/npm/v/level-tree.svg)](https://www.npmjs.com/package/level-tree)
[![build status](https://img.shields.io/travis/derhuerst/level-tree.svg)](https://travis-ci.org/derhuerst/level-tree)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/level-tree.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)


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
	a2: {
		b1: 'A2-B1',
		b2: {
			c1: 'A2-B2-C1'
		}
	}
}, (err) => {
	if (err) return console.error(err)

	db.put('example.a2.b1', 'a new value', (err) => {
		if (err) return console.error(err)

		tree.get('example', (err, example) => {
			if (err) return console.error(err)

			console.log(example)
		})
	})
})
```

You can also load `get` and `put` separately:

```js
const createGet = require('@derhuerst/level-tree/get')
const createPut = require('@derhuerst/level-tree/put')

const get = createGet(db)
const put = createPut(db)
```


## Contributing

If you have a question or have difficulties using `level-tree`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/level-tree/issues).
