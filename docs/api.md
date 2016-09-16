## Full API Usage

> All API methods in the cache hook return a promise.

### GET

Returns a specific cache item by key.

- key [String]
  - required: `true`
  
```
RediBox.hooks.cache
  .get('cat')
  .then(data => {
    console.log('Got a cat from cache', data);
  });
```

### SET

Adds a new cache item by key name.

- key [String]
  - required: `true`
  
- value [Object/Array/Primitive]
  - required: `true`
  
- ttl [Number]
  - required: `false`
  - default: `60`
The time this particular item will be stored in the cache, in seconds.

```
RediBox.hooks.cache
  .set('cat:fluffy', 'https://pbs.twimg.com/media/CYY44mYWMAATghb.jpg:small', 120)
  .then(() => {
    console.log('Set a fluffy cat in cache for two minutes');
  });
```

### DEL

Deletes a specific cache item by key.

- key [String]
  - required: `true`
  
```
RediBox.hooks.cache
  .get('cat')
  .then(data => {
    console.log('Got a cat from cache', data);
  });
```

### CLEAR

Removes all, a specific, or a wildcard amount of items from the cache by key.

- key [String]
  - required: `false`
If empty, will remove all cached items. To wildcard a filter, append a `*` onto the key.


```
// Delete all items in cache
RediBox.hooks.cache
  .clear()
  .then(data => {
    console.log('Clear all data in cache');
  });

// Delete all matching wildcard items in cache
RediBox.hooks.cache
  .clear('cat:fluffy:*').then(data => {
    console.log('Clear wildcard data from cache');
  });
```

### wrapPromise

Caches a promises response in cache, by key.

- key [String]
  - required: `true`

- promise [Promise]
  - required: `true`
A deferred promise, whose return/resolve value will be set in cache.

- ttl [Number]
  - required: `false`
  - default: `60`
The time this particular item will be stored in the cache, in seconds.

- skipCache [Bool]
  - required: `false`
  - default: `false`
If `true`, the cache will be completley ignored.

```
const deferred = () => {
  return User.find();
};

return Cache
  .wrapPromise(
    'external-api-data',
    deferred,
    120,
    true,
  );
```

### wrapWaterline

Caches a Waterline ORM query. The key is created automatically based on the model and query values.

- query [Promise/Waterline]
  - required: `true`
  
