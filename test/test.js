var axios = require('axios');
var expect = require('chai').expect;
var express = require('express');
var expressEvents = require('..');

var port = process.env.PORT || 8080;

describe('Express-Events', ()=> {

	var server
	var emitted = {end: 0, json: 0};
	before('setup basic express instance', finish => {
		axios.defaults.baseURL = `http://localhost:${port}`;

		var app = express();
		app.use(expressEvents());

		app.get('/simple', (req, res) => res.send({foo: 'Foo!'}));
		app.get('/end', (req, res) => {
			// res.on('end', ()=> emitted.end++);
			res.send('Hi');
		});

		server = app.listen(port, null, finish);
	});

	after(()=> server && server.close());

	it('should not alter existing end-points', ()=>
		axios.get('/simple')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should have emitted end when the request terminates', ()=>
		axios.get('/end')
			.then(res => expect(emitted.end).to.be.equal(1))
	);

});
