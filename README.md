@MomsFriendlyDevCo/Express-Events
=================================
Improved event emitter for express.


This module adds a simple middleware function which transforms `res` into an event emitter and provides hookable functionality.

All events are executed via [Eventer](https://github.com/MomsFriendlyDevCo/eventer) which means all events are async friendly promisable functions which will be waited for before the emitter continues.


API
===

Event: end(...args)
-------------------
Emitted when `res.end()` gets called with the original arguments.
