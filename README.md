middy-redis
===

[![travis build](https://travis-ci.org/anglinb/middy-redis.svg?branch=master)](https://travis-ci.org/anglinb/middy-redis)

Middy middleware for connecting to redis

## Getting Started

Installing `middy-redis`

```bash
npm install --save middy, redis # You need middy and redis installed
npm install --save middy-redis
```

Running the tests
```bash
npm test
```

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


## Contributing

Feel free to open a Pull Request or Issue w/ a bug report or feature request.
