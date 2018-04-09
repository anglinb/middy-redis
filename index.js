const debug = require('debug')('middy-redis')
const redisClient = require('redis')

/**
 * This callback is used to resolve the `redisURI` when passed an event. It should a valid redisURI as a string (can be async)
 *
 * @callback redisURIResolver
 * @async
 * @param {Object} event - This is the raw event object (can be altered by previous middlewares)
 * @returns {string} The `redisURI`
 */

/**
 * Middy redis - Loads up redis for you before calling your handler
 * @module middy-redis
 * @param {Object} config - Configuration on how to find your redis instance (redisURIResolver has priority if both defined)
 * @param {string} config.redisURI - Redis url ex: `redis://localhost:6379`
 * @param {redisURIResolver} config.redisURIResolver - Function called to get the `redisURI` at runtime
 * @example
 *
 * const middyRedis = require('middy-redis')
 * const middy = require('middy')
 *
 * const someHandler = (event, context, callback) => {
 *
 *   // The redis instance is accessible from the event object
 *   event.redis.get('some_key', (err, value) => {
 *     if (err) {
 *       return callback(err)
 *     }
 *     callback(null, value)
 *   }
 * }
 *
 * // Lets you connect to a different redis instance based on information in the event.
 * // This example hard codes a value.
 * let resolver = (event) => {
 *   return 'redis://localhost:6379'
 * }
 *
 * const handler = middy(someHandler)
 *   .use(middyRedis({ redisURIResolver: resolver })
 *
 * module.exports = { handler }
 *
 */
module.exports = ({ redisURI = undefined, redisURIResolver = undefined } = {}) => {
  if (!redisURI && !redisURIResolver) {
    throw new Error('middy-redis configuration error: Please provide a redisURI or redisURIResolver')
  }

  /**
   * Before - Called to load redis, will wait until redis is ready to proceed
   * @function before
   * @param {Object} handler - Current handler
   * @modifies {handler}
   */
  const before = async (handler) => {
    let resolvedRedisURI = redisURIResolver ? (await redisURIResolver(handler.event)) : redisURI
    debug('resolved redis URI', resolvedRedisURI)
    const redis = redisClient.createClient(resolvedRedisURI)
    await new Promise((resolve, reject) => {
      debug('waiting for redis to be ready')
      redis.on('ready', () => {
        debug('redis ready')
        resolve()
      })
    })
    handler.event.redis = redis
  }

  /**
   * After - Called to quit redis and close the connection
   * @function after
   * @param {Object} handler - Current handler
   * @modifies {handler}
   */
  const after = async (handler) => {
    return new Promise((resolve, reject) => {
      debug('attempting to quit redis')
      handler.event.redis.quit(() => {
        debug('redis quit successful')
        handler.event.redis = undefined
        resolve()
      })
    })
  }

  return {
    before,
    after
  }
}
