## Handling Async

Asychronous processing in Node is often heavily used, especially when database operations or external API data need to be cached.

Luckily there's an handy `wrapPromise` included in this hook to easily handle this for you.

### wrapPromise

- key [String]
The key this item will be cached under within Redis.

- Promise
A **deferred** promise. The return value of this will be the cached data.

- TTL
  - default: `60`
How long the item will be stored in Redis.

### Usage

> The key thing to remember with this is to always return a deferred promise, otherwise it'll still execute the promise
each time as in in-line function.

```
const deferred = () => {
  return new Promise(resolve => { 
    // Simulate a long async task
    setTimeout(() => {
      return ('some mocked api data');
    }, 3000);
  });
};

return Cache
  .wrapPromise(
    'external-api-data',
    deferred,
    120
  );
```

In this example, the deferred promise will only execute once per 2 minutes.

Functions which also return a promise, such as database queries using the Waterline ORM can be passed in directly, which has the same effect:

```
const deferred = () => {
  return User.find();
};

return Cache
  .wrapPromise(
    'external-api-data',
    deferred,
    120
  );
```
