var eventer = require('@momsfriendlydevco/eventer');

var ee = module.exports = function(options) {
	return function(req, res, next) {
		// Glue eventer structure onto res
		eventer.extend(res);

		// Overload res.end (copying old version to res.$endRaw)
		res.$endRaw = res.end;
		res.end = (...args) =>
			res.emit('end', ...args)
				.then(()=> res.$endRaw(...args));


		// Overload res.json (copying old version to res.$jsonRaw)
		res.$jsonRaw = res.json;
		res.json = (payload, ...args) =>
			res.emit('json', payload)
				.then(result => res.$jsonRaw(result, ...args));

		//
		// Overload res.redirect (copying old version to res.$redirectRaw)
		res.$redirectRaw = res.redirect;
		res.redirect = (url) =>
			res.emit('redirect', url)
				.then(()=> res.$redirectRaw(url))


		// Overload res.sendFile (copying old version to res.$sendFileRaw)
		res.$sendFileRaw = res.sendFile;
		res.sendFile = (payload, ...args) =>
			res.emit('sendFile', payload)
				.then(()=> res.$sendFileRaw(payload, ...args))

		return next();
	};
};
