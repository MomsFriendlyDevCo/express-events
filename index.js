var eventer = require('@momsfriendlydevco/eventer');

var ee = function(options) {
	return function(req, res, next) {
		// Glue eventer structure onto res
		eventer.extend(res);

		// Overload res.end (copying old version to res.$endRaw)
		res.$endRaw = res.end;
		res.end = (...args) =>
			res.emit('end', ...args)
				.then(()=> res.$endRaw(...args));

		return next();
	};
};

ee.defaults = {
};

module.exports = ee;
