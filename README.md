@MomsFriendlyDevCo/Express-Events
=================================
Improved event emitter for express.

This module adds a simple middleware function which transforms `res` into an event emitter and provides hookable functionality.

All events are executed via [Eventer](https://github.com/MomsFriendlyDevCo/eventer) which means all events are async friendly promisable functions which will be waited for before the emitter continues.


```javascript
var express = require('express');
var expressEvents = require('@momsfriendlydevco/express-events');

var app = express();

// Add into all requests from root onwards (use a prefix to limit)
app.use(expressEvents());


// Log how all endpoints took to respond
app.use((req, res, next) => {
	var startTime = Date.now();
	res.on('end', ()=> {
		console.log('HIT', req.path, 'took', Date.now() - startTime, 'ms');
	});
});


// Log how big the output of any buffer response was
app.use('/buffers', (req, res, next) => {
	res.on('send', output => {
		if (Buffer.isBuffer(output)) console.log('Buffered output for endpoint', req.path, 'is', buffer.length, 'bytes');
		return output; // Pass output to actual outputter
	});
	next();
});


// Glue `{status: 'goodbye'}` onto the end of all JSON requests
app.use('/api', (req, res, next) => {
	res.on('json', payload => {...payload, status: 'goodbye'});
	next();
});
```


API
===

Event: end(...args)
-------------------
Emitted when `res.end()` gets called with the original arguments.


Event: json(payload)
--------------------
Emitted on each call to `res.json()` with the original object payload. Subsequent functions can mutate the output before outputting.

```javascript
app.get('/api/test/json', (req, res) => {
	res.on('json', payload => ({...payload, bar: 'Bar!'})) // Glue 'bar' key onto output
	res.send({foo: 'Foo!']) // Eventually outputs {foo: 'Foo!', bar: 'Bar!'}
});
```


Event: sendFile(stream)
-----------------------
Emitted on each call to `res.sendFile()` with the read stream.
