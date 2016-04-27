## RediBox Plugin Cache


Caching data via redis is a common usage for redis.

However it's not always as simple as calling a Redis `set` or `get`. You generally need to be able to set a global **ttl**
on all cache items as well as variable **ttl**'s on different bits of data.

You really don't want to be writing the same code over and over again just to do the same steps all the time:

 - `get` a cached item
 - `query` original source data because no cache found (e.g running a large mongo aggregate query)
 - `set` cache for new query data
 - `return` the original source data, but next time around if within `ttl` this will come from redis cache \o/

Enter RediBox.cache!

### Installation

`npm i redibox-plugin-cache --save`

You need `redibox` installed and configured to be able to use this plugin.

### Config

Configuring the cache options is the same as on all other modules, when creating your instance of RediBox, simply pass
into the options a `cache` property object with all your config.

For example:

```javascript
  import Redibox from 'redibox';
  // create new instance
  const RediBox = new Redibox({
    redis: {
      ...yourRedisConfig  // see homepage for options
    },
    cache: {
      // turn this off to stop caching on all the utility methods
      // e.g when off `wrapPromise` will simply exec the passed promise
      // and bypass caching entirely
      //
      // to turn this on/off dynamically then simply call RediBox.cache.bypass(boolean);
      // or just get/set the value at `RediBox.cache.enabled`
      enabled: true,

      // default ttl (time to live, in seconds by default) on all cache items
      // this is only used if no ttl specified on each individual cache `set`
      defaultTTL: 60,

      // key prefix used on all keys
      prefix: 'rdb:cache:cats_app'
    }
  });
```

Now before we get to the goodies, there is of course the usual `set`, `get`, `del` and `clear` cache commands:

##### RediBox.cache.get(key: string, [Optional] cb: Function) : [Optional] Promise
 - Gets a cached item from redis.

##### RediBox.cache.set(key: string, value: string|Object|etc, [Optional] ttl, [Optional] cb: Function): [Optional] Promise
 - Create a new cached item in redis.

##### RediBox.cache.del(key: string, [Optional] cb: Function) : [Optional] Promise
 - Deletes a cached item from redis.

##### RediBox.cache.clear([Optional] key: string, [Optional] cb: Function) : [Optional] Promise
 - Deletes all cache items or all items matching a cache key pattern prefix e.g. `cats:fluffy:*`


### Utilities

And now for the goodies! To save yourself repeating the logical steps mentioned earlier, you can use these caching utilities!

##### RediBox.cache.wrapPromise(key: string, promise: Promise, [Optional] ttl, [Optional] skipCache: boolean): Promise
 - Wraps a promise for the purposes of caching a successful resolve.

Usage example:
```javascript
  RediBox.cache.wrapPromise('collection_of_cats', new Promise((resolve, reject) => {
    // after the first time and for the next 5 minutes this will just come from redis cache
    return resolve(['meow', 'meow', 'angry_meow']);
  }), 360); // cache them for 5 minutes
```

The optional 4th param, `skipCache`, allows you to bypass caching and just exec the passed promise as normal.

##### RediBox.cache.wrapWaterline(waterlineQuery: Query, [Optional] ttl, [Optional] key: string, [Optional] skipCache: boolean): Promise

 - Cache wrap a sails.js / waterline query. Obviously if you don't know what these are then this is of no use to you :).

Note that this time the key is optional! So what does it call the cache key name? The cache key name is generated using
a mix of the `model` name (if available, depends on adapter) and the query criteria. See the example for the key format.

```javascript
  RediBox.cache.wrapWaterline(
    Cats.find({
      name: 'Evie',
      likes: 'belly rubs'
    })  // without the exec()
  ).then(function (thatCat) {
    // do something
  }).catch(function (waterlineError) {
    // do something
  });

  // the key created from this will look something similar to:
  // 'cats:name_evie_likes_belly_rubs' // yes, yes she does \o/
  // so basically it's just: `${modelName}:${criteria}`
```

Internally if not found in cache then RediBox will execute the query, cache it and return the results.

##### RediBox.cache.makeKeyFromObject([Optional] prefix: string, object: Object): String
 - Just a simple utility to turn an object into a pretty key name.

Example:
```javascript
  const key = RediBox.cache.makeKeyFromObject('Cats', {
    name: 'Evie',
    likes: 'belly rubs'
  });

  console.log(key); // cats:name_evie_likes_belly_rubs

  // now do something with this key, maybe a `.set()` or `.get`?
```

### Todo

  - `wrapExpress` - wrap express query / potentially provide middleware for this.
  - `wrapCallback` - though potentially this can be done in wrapPromise and then `nodify` it.
  - `set`, `clear` and `del` only accept callbacks at the moment, `nodify` with promises.

"RUB MA BELLEH RIGHT MEOW" 
![Evie](https://pbs.twimg.com/media/CYY44mYWMAATghb.jpg:large) 
[@elliothesp](https://twitter.com/elliothesp) 
