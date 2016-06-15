import Promise from 'bluebird';
import defaults from './defaults';
import { BaseHook, tryJSONParse, tryJSONStringify, isObject } from 'redibox';

export default class Cache extends BaseHook {
  constructor() {
    super('cache');
    // this._mountToCore = true;
  }

  // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
  /**
   * Default config for scheduler
   * @returns {{someDefaultThing: string}}
   */
  defaults() {
    return defaults;
  }

  /**
   * Cleanup prefixes
   */
  initialize() {
    if (this.options.keyPrefix && this.options.keyPrefix.charAt(0) !== ':') {
      /* eslint max-len: 0 */
      if (this.core.options.redis.keyPrefix && this.core.options.redis.keyPrefix.charAt(this.core.options.redis.keyPrefix.length - 1) !== ':') {
        this.options.keyPrefix = `:${this.options.keyPrefix}`;
      }
    }

    /* eslint max-len: 0 */
    if (this.options.keyPrefix && this.options.keyPrefix.charAt(this.options.keyPrefix.length - 1) !== ':') {
      this.options.keyPrefix = `${this.options.keyPrefix}:`;
    }

    return Promise.resolve();
  }

  /**
   * Converts the users key to the full redis key with module prefix.
   * @param key
   * @returns {string}
   */
  toKey(key = '') {
    return `${this.options.keyPrefix}${key}`;
  }

  /**
   * To enable bypassing of cache for wrap functions
   * Toggles by default or pass in true/false
   * @param bool
   */
  enabled(bool) {
    this.options.enabled = bool || !this.options.enabled;
  }

  /**
   * Gets a cached item from redis.
   * @param {String} key Key
   * @return {*} No Returns
   */
  get(key) {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    return this
      .client
      .get(this.toKey(key))
      .then(value => {
        if (!value) {
          return value;
        }

        return tryJSONParse(value);
      });
  }

  /**
   * Create a new cached item.
   * @param {String} key Key
   * @param {String|Number|Object} val Value
   * @param {Number} ttl [Optional] Time to Live in seconds - defaults to global ttl
   * @returns {*} No Returns.
   */
  set(key, val, ttl) {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    if (!ttl) {
      ttl = this.options.defaultTTL;
    }

    if (typeof val !== 'string' && typeof val !== 'number') {
      if (isObject(val) && val.toObject) {
        val = val.toObject();
      } else if (Array.isArray(val) && val.length && isObject(val[0]) && val[0].toObject) {
        for (let i = 0, iLen = val.length; i < iLen; i++) {
          val[i] = isObject(val[i]) && val[i].toObject ? val[i].toObject() : val[i];
        }
      }
      val = tryJSONStringify(val);
    }

    if (!val) {
      return Promise.reject(new Error('Invalid data type provided for cache.set'));
    }

    return this.client.set(this.toKey(key), val, 'NX', 'EX', ttl);
  }

  /**
   * Deletes a cached item.
   * @param {String} key Key
   * @returns {*} No Returns
   */
  del(key) {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    return this.client.del(this.toKey(key));
  }

  /**
   * Cache wrap a sails waterline query.
   * @param {Object} waterlineQuery Waterline model before exec/then.
   * @param {Number} ttl key expiry time
   * @param {Boolean} keyOverride optional key override
   * @param {Boolean} skipCache whether to ignore cache and exec the waterlineQuery instead
   * @returns {Promise} ES6 Promise
   */
  wrapWaterline(waterlineQuery, ttl, keyOverride, skipCache) {
    return this.wrapPromise(
      this.makeKeyFromQuery(waterlineQuery, keyOverride),
      waterlineQuery,
      ttl,
      skipCache
    );
  }

  /**
   * Wraps a promise for the purposes of caching a successful result.
   * @param key
   * @param promise
   * @param ttl
   * @param skipCache
   * @returns {Promise}
   */
  wrapPromise(key, promise, ttl, skipCache) {
    if (!key || typeof key !== 'string') {
      return Promise.reject(new Error('wrapPromise requires a valid key name (string).'));
    }

    if (skipCache || !this.options.enabled) {
      return promise.then ? promise : promise();
    }

    if (!this.core.isClientConnected(this.client)) {
      this.log.warn(
        'Redis server not connected or is not in a ready state, temporarily bypassing cache...'
      );
      return promise.then ? promise : promise();
    }

    let foundCache = false;
    return this.get(key).then(value => {
      if (value) {
        foundCache = true;
        return value;
      }
      return promise.then ? promise : promise();
    }).then(value =>
      Promise.all([
        Promise.resolve(value),
        !foundCache && value ? this.set(key, value, ttl) : Promise.resolve(),
      ])
    ).then(results => results[0]);
  }

  /**
   * Scan stream delete keys for a provided client
   * @param key
   * @param client
   */
  streamDelete(key, client) {
    return new Promise((resolve) => {
      let count = 0;
      const stream = client.scanStream({
        match: `${this.core.options.redis.keyPrefix}${this.toKey(key)}*`,
      });
      stream.on('data', keys => {
        if (keys.length) {
          const pipeline = client.pipeline();
          for (let i = 0, len = keys.length; i < len; i++) {
            count++;
            pipeline.del(keys[i]);
          }
          pipeline.exec();
        }
      });
      stream.on('end', () => resolve(count));
    });
  }

  /**
   * Deletes all cached items or all items matching a cache key pattern.
   * @param {String} key Key
   * @returns {*} No Returns
   */
  clear(key = '') {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    // standalone instance
    if (!this.core.cluster.isCluster()) {
      return this.streamDelete(key, this.client);
    }

    // parallel cluster scan streams
    return Promise.map(this.core.cluster.getMasters(), nodeAddress => {
      const client = this.core.cluster.getNodeClient(nodeAddress);
      /* istanbul ignore next */
      if (!client) return Promise.resolve();
      return this.streamDelete(key, client);
    });
  }

  /**
   * Returns a list of keys based on the provided key prefix.
   * @param {String} key Key prefix to search for.
   * @returns {*} No Returns
   */
  list(key = '') {
    if (!this.core.isClientConnected(this.client)) {
      return Promise.reject(new Error('Redis not connected or ready.'));
    }

    return new Promise((resolve) => {
      let result = [];
      const stream = this.client.scanStream({
        match: `${this.core.options.redis.keyPrefix}${this.toKey(key)}*`,
      });
      stream.on('data', keys => {
        if (keys.length) {
          result = result.concat(keys);
        }
      });
      stream.on('end', () => resolve(result));
    });
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Generates a key from a waterline query object. Basically stringifies the
   * sails _criteria object and removes non alphanumeric characters + white spaces
   * @param waterlineQuery
   * @param keyOverride
   * @returns {*}
   */
  makeKeyFromQuery(waterlineQuery, keyOverride) {
    if (keyOverride) {
      return keyOverride;
    }

    let modelName = '';

    if (waterlineQuery && waterlineQuery._context &&
      waterlineQuery._context.adapter &&
      waterlineQuery._context.adapter.identity) {
      modelName = waterlineQuery._context.adapter.identity;
    }

    return this.makeKeyFromObject(modelName, waterlineQuery._criteria);
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Stringify an object to a pretty key name.  OOO PRETTTYYY
   * @param prefix
   * @param object
   * @returns {*}
   */
  makeKeyFromObject(prefix = '', object = {}) {
    const criteria = tryJSONStringify(object)
      .replace(/\W+/g, '')
      .replace(/wherenull/g, '')
      .replace(/:/g, '');

    if (criteria && criteria !== '') {
      return `${prefix}:${criteria}`;
    }

    /* istanbul ignore next */
    return `${prefix}`;
  }

}
