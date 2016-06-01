/* eslint no-underscore-dangle: 0 */
import { assert } from 'chai';

describe('cache hook', () => {
  it('Should prefix keys', (done) => {
    const key = Hook.toKey('test');
    assert.equal(key, 'cache:test');
    done();
  });

  it('Should get/set cache data', () => {
    return Hook
      .set('test1', 'hello1', 60)
      .then(res => {
        assert.equal(res, 'OK');
        // get the set cache item
        return Hook
          .get('test1')
          .then(value => {
            assert.equal(value, 'hello1');
            return Promise.resolve();
          });
      });
  });

  it('Should cache wrap promises', () => {
    return Hook
      .wrapPromise('test2', Promise.resolve('hello2'))
      .then(res => {
        assert.equal(res, 'hello2');
        // get the set cache item
        return Hook
          .get('test2')
          .then(value => {
            assert.equal(value, 'hello2');
            // again - should be from cache now
            return Hook
              .wrapPromise('test2', Promise.resolve('hello2'))
              .then(resCached => {
                assert.equal(resCached, 'hello2');
              });
          });
      });
  });

  it('Should cache wrap waterline query promises', () => {
    const fakeWaterline = Promise.resolve('hello2');
    fakeWaterline._criteria = { chickens: true };
    fakeWaterline._context = {
      adapter: {
        identity: 'fakemodelname',
      },
    };
    return Hook
      .wrapWaterline(fakeWaterline)
      .then(res => {
        assert.equal(res, 'hello2');
        // get the set cache item
        return Hook
          .get('fakemodelname:chickenstrue')
          .then(value => {
            assert.equal(value, 'hello2');
            // again - should be from cache now
            return Promise.resolve();
          });
      });
  });

  it('Should cache wrap waterline query promises with a custom key', () => {
    const fakeWaterline = Promise.resolve('hello34562');
    fakeWaterline._criteria = { chickens: true };
    fakeWaterline._context = {
      adapter: {
        identity: 'fakemodelname',
      },
    };
    return Hook
      .wrapWaterline(fakeWaterline, null, 'testingkey66')
      .then(res => {
        assert.equal(res, 'hello34562');
        // get the set cache item
        return Hook
          .get('testingkey66')
          .then(value => {
            assert.equal(value, 'hello34562');
            // again - should be from cache now
            return Promise.resolve();
          });
      });
  });

  it('Should reject wrapPromise if no key', () => {
    return Hook
      .wrapPromise(Promise.resolve('urm'))
      .then(() => {
        throw new Error('Cache did not reject missing key.');
      }).catch(error => {
        assert.equal(error.message, 'wrapPromise requires a valid key name (string).');
        return Promise.resolve();
      });
  });

  it('Should bypass cache if disabled', () => {
    Hook.enabled(false);
    return Hook
      .wrapPromise('test66', Promise.resolve('urm'))
      .then((res) => {
        assert.equal(res, 'urm');
        return Hook
          .get('test66')
          .then(value => {
            assert.isFalse(Hook.options.enabled);
            Hook.enabled(true);
            assert.isTrue(Hook.options.enabled);
            assert.isNull(value);
          });
      });
  });

  it('Should bypass cache if offline', () => {
    Hook.client.status = 'connecting';
    return Hook
      .wrapPromise('test77', Promise.resolve('urm'))
      .then((res) => {
        assert.equal(res, 'urm');
        Hook.client.status = 'ready';
        return Hook
          .get('test77')
          .then(value => {
            assert.isNull(value); // should not exist as we were offline
          });
      });
  });

  it('Should reject clear, list, del, get and set commands if offline', () => {
    Hook.client.status = 'connecting';
    return Promise.all([
      Hook.get('test88')
          .catch(error => assert.equal(error.message, 'Redis not connected or ready.')),
      Hook.set('test88')
          .catch(error => assert.equal(error.message, 'Redis not connected or ready.')),
      Hook.del('test88')
          .catch(error => assert.equal(error.message, 'Redis not connected or ready.')),
      Hook.clear('tes')
          .catch(error => assert.equal(error.message, 'Redis not connected or ready.')),
      Hook.list('tes')
          .catch(error => assert.equal(error.message, 'Redis not connected or ready.')),
    ]).then(() => {
      Hook.client.status = 'ready';
      return Promise.resolve();
    });
  });

  it('Should del a singe cache key item', () => {
    return Hook
      .set('test333', { test: 'abcd' })
      .then(res => {
        assert.equal(res, 'OK');
        // get the set cache item
        return Hook.del('test333').then(delRes => {
          assert.equal(delRes, 1);
          return Hook
            .get('test333')
            .then(value => {
              assert.isNull(value);
              return Promise.resolve();
            });
        });
      });
  });

  it('Should clear all cached items', () => {
    return Promise.all([
      Hook.set('testr33993', { test: 'abcd' }),
      Hook.set('test33ret4', { test: 'abcd' }),
      Hook.set('tesrhht33563', { test: 'abcd' }),
      Hook.set('teshsts3433', { test: 'abcd' }),
      Hook.set('testmmm333', { test: 'abcd' }),
      Hook.set('test3ssbnm3883', { test: 'abcd' }),
      Hook.set('testffdfdde3331', { test: 'abcd' }),
    ]).then(() => {
      return Hook.clear('tes').then(count => {
        assert.equal(count, 7);
        return Promise.resolve();
      });
    });
  });

  it('Should list all cached items', () => {
    return Promise.all([
      Hook.set('testr33993', { test: 'abcd' }),
      Hook.set('test33ret4', { test: 'abcd' }),
      Hook.set('tesrhht33563', { test: 'abcd' }),
      Hook.set('teshsts3433', { test: 'abcd' }),
      Hook.set('testmmm333', { test: 'abcd' }),
      Hook.set('test3ssbnm3883', { test: 'abcd' }),
      Hook.set('testffdfdde3331', { test: 'abcd' }),
    ]).then(() => {
      return Hook.list('tes').then(keys => {
        assert.equal(keys.length, 7);
        return Promise.resolve();
      });
    });
  });

  it('Should cache objects', () => {
    return Hook
      .set('test3', { test: 'abcd' })
      .then(res => {
        assert.equal(res, 'OK');
        // get the set cache item
        return Hook
          .get('test3')
          .then(value => {
            assert.equal(value.test, 'abcd');
            return Promise.resolve();
          });
      });
  });

  it('Should reject invalid types', () => {
    return Hook
      .set('test3', Hook) // sent the hook itself because it's a class so therefore invalid
      .then(() => {
        throw new Error('Cache did not reject invalid type.');
      }).catch(error => {
        assert.equal(error.message, 'Invalid data type provided for cache.set');
        return Promise.resolve();
      });
  });
});
