[![Coverage Status](https://coveralls.io/repos/github/redibox/cache/badge.svg?branch=master)](https://coveralls.io/github/redibox/cache?branch=master)
![Downloads](https://img.shields.io/npm/dt/redibox-hook-cache.svg)
[![npm version](https://img.shields.io/npm/v/redibox-hook-cache.svg)](https://www.npmjs.com/package/redibox-hook-cache)
[![dependencies](https://img.shields.io/david/redibox/cache.svg)](https://david-dm.org/redibox/cache)
[![build](https://travis-ci.org/redibox/cache.svg)](https://travis-ci.org/redibox/cache)
[![License](https://img.shields.io/npm/l/redibox-hook-cache.svg)](/LICENSE)

## RediBox Cache

Cache any data quickly and easily in Redis. Caching data is important to most applications. This hook handles various common requirements for caching data, specifically in Redis.

### Installation

First ensure you have [RediBox](https://github.com/redibox/core) installed.

Install Schedule via npm:

`npm install redibox-hook-cache --save`

### Usage

#### Configure cache

> This hook will still work without setting any configuration options.

Within your `redibox` config, we'll setup a new `cache` object containing our configiration options:

- **enabled** [Boolean]
  - default: `true`
If disabled will by-pass any cached data.
- **defaultTTL** [Number]
  - default: `60`
In seconds, if no time to live (TTL) is specified, this is how long items to live in the cache for.
- **keyPrefix** [String]
  - default: `cache`
The namespace to store the cached items in Redis under. Shouldn't usually need changing.

#### Basic API

##### GET
```javascript
// Get data by key from the cache
RediBox.hooks.cache.get('cat').then(data => {
  console.log('Got a cat from cache', data);
});
```

##### SET
```javascript
// Set data by key in the cache
RediBox.hooks.cache.set('cat:fluffy', 'https://pbs.twimg.com/media/CYY44mYWMAATghb.jpg:small').then(() => {
  console.log('Set a fluffy cat in cache');
});
```

##### DEL
```javascript
// Delete an item by key in the cache
RediBox.hooks.cache.del('cat').then(data => {
  console.log('Deleted item');
});
```

##### CLEAR
```javascript
// Delete all items in cache
RediBox.hooks.cache.clear().then(data => {
  console.log('Clear all data in cache');
});

// Delete all matching wildcard items in cache
RediBox.hooks.cache.clear('cat:fluffy:*').then(data => {
  console.log('Clear wildcard data from cache');
});
```

### Advanced Usage

- [Full API Usages]()
- [Handling Promises]()
- [Usage with the Waterline ORM]()
- [Handling cache key names]()
