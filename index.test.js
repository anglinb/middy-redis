const debug = require('debug')('tests:middy-redis')

const middy = require('middy')
const redisClient = require('redis')

const middyRedis = require('./')

const flushAll = (redis) => {
  return new Promise((resolve, reject) => {
    redis.flushall((err, success) => {
      if (err) { return reject(err) }
      resolve(success)
    })
  })
}

const setKey = async (redis, key, value) => {
  return new Promise((resolve, reject) => {
    redis.set(key, value, (err, success) => {
      if (err) { return reject(err) }
      resolve(success)
    })
  })
}

const getKey = async (redis, key) => {
  return new Promise((resolve, reject) => {
    redis.get(key, (err, success) => {
      if (err) { return reject(err) }
      resolve(success)
    })
  })
}

describe('middyRedis', () => {
  beforeEach(() => {
    const redisInstance = redisClient.createClient('redis://localhost:6379')
    return flushAll(redisInstance)
  })

  describe('configuration', () => {
    it('should require the redisURI or redisURIResolver', () => {
      expect(() => {
        middyRedis()
      }).toThrowErrorMatchingSnapshot()
    })

    it('should use redisURIResolver over redisURI', async () => {
      const handler = middy((event, context, callback) => {
        getKey(event.redis, 'mykey').then((value) => {
          callback(null, value)
        })
      })

      handler.use(middyRedis({ redisURI: 'redis://localhost:6379/4',
        redisURIResolver: (event) => {
          return 'redis://localhost:6379/5'
        }}))

      let dbFiveRedis = redisClient.createClient('redis://localhost:6379/5')
      await setKey(dbFiveRedis, 'mykey', 'hello')
      let handlerResp = await new Promise((resolve, reject) => {
        handler({}, null, (err, resp) => {
          debug('callback: %o %o', err, resp)
          if (err) { return reject(err) }
          resolve(resp)
        })
      })
      expect(handlerResp).toEqual('hello')
    })

    it('should use redisURI', async () => {
      const handler = middy((event, context, callback) => {
        getKey(event.redis, 'mykey').then((value) => {
          callback(null, value)
        })
      })

      handler.use(middyRedis({ redisURI: 'redis://localhost:6379/4' }))

      let dbFiveRedis = redisClient.createClient('redis://localhost:6379/4')
      await setKey(dbFiveRedis, 'mykey', 'hello')
      let handlerResp = await new Promise((resolve, reject) => {
        handler({}, null, (err, resp) => {
          debug('callback: %o %o', err, resp)
          if (err) { return reject(err) }
          resolve(resp)
        })
      })
      expect(handlerResp).toEqual('hello')
    })

    it('should allow for async redisURIResolvers', async () => {
      const handler = middy((event, context, callback) => {
        getKey(event.redis, 'mykey').then((value) => {
          callback(null, value)
        })
      })

      handler.use(middyRedis({ redisURIResolver: async (event) => {
        await new Promise((resolve, reject) => { setTimeout(resolve, 20) })
        return 'redis://localhost:6379/5'
      }}))

      let dbFiveRedis = redisClient.createClient('redis://localhost:6379/5')
      await setKey(dbFiveRedis, 'mykey', 'hello')

      let handlerResp = await new Promise((resolve, reject) => {
        handler({}, null, (err, resp) => {
          debug('callback: %o %o', err, resp)
          if (err) { return reject(err) }
          resolve(resp)
        })
      })
      expect(handlerResp).toEqual('hello')
    })
  })
  describe('usage', () => {
    it('should connect and set keys', async () => {
      const handler = middy((event, context, callback) => {
        getKey(event.redis, 'mykey').then((value) => {
          callback(null, value)
        })
      })

      handler.use(middyRedis({ redisURI: 'redis://localhost:6379/2' }))
      let handlerResp = await new Promise((resolve, reject) => {
        handler({}, null, (err, resp) => {
          debug('callback: %o %o', err, resp)
          if (err) { return reject(err) }
          resolve(resp)
        })
      })
      expect(handlerResp).toEqual(null)

      let dbTwoRedis = redisClient.createClient('redis://localhost:6379/2')
      await setKey(dbTwoRedis, 'mykey', 'hello')

      handlerResp = await new Promise((resolve, reject) => {
        handler({}, null, (err, resp) => {
          debug('callback: %o %o', err, resp)
          if (err) { return reject(err) }
          resolve(resp)
        })
      })
      expect(handlerResp).toEqual('hello')
    })
  })
})
