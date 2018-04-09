middy-redis
===

Middy middleware for connecting to redis


## Usage

```javascript
const middyRedis = require('middy-redis')
const middy = require('middy')

const someHandler = (event, context, callback) => {

  // The redis instance is accessible from the event object
  event.redis.get('some_key', (err, value) => {
    if (err) {
      return callback(err)
    }
    callback(null, value)
  }
}

// Lets you connect to a different redis instance based on information in the event.
// This example hard codes a value.
let resolver = (event) => {
  return 'redis://localhost:6379'
}

const handler = middy(someHandler)
  .use(middyRedis({ redisURIResolver: resolver })

module.exports = { handler }
```
