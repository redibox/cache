/* eslint no-underscore-dangle: 0 */
import { assert } from 'chai';

describe('cache hook - cluster', () => {
  it('Should clear all cached items', () => {
    return Promise.all([
      HookCluster.set('testr33993', { test: 'abcd' }),
      HookCluster.set('test33ret4', { test: 'abcd' }),
      HookCluster.set('tesrhht33563', { test: 'abcd' }),
      HookCluster.set('teshsts3433', { test: 'abcd' }),
      HookCluster.set('testmmm333', { test: 'abcd' }),
      HookCluster.set('test3ssbnm3883', { test: 'abcd' }),
      HookCluster.set('testffdfdde3331', { test: 'abcd' }),
    ]).then(() => {
      return HookCluster.clear('tes').then(count => {
        assert.equal(count.length, 3);
        assert.equal(count[0], 2);
        assert.equal(count[1], 4);
        assert.equal(count[2], 1);
        return Promise.resolve();
      });
    });
  });
});
