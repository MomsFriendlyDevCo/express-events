var axios = require('axios');
var expect = require('chai').expect;
var express = require('express');
var expressEvents = require('..');

var port = process.env.PORT || 8080;

describe('Express-Events', ()=> {

	var server
	var emitted = {end: 0, json: 0, sendFile: 0};
	before('setup basic express instance', finish => {
		axios.defaults.baseURL = `http://localhost:${port}`;

		var app = express();
		app.use(expressEvents());

		app.get('/simple', (req, res) => res.send({foo: 'Foo!'}));
		app.get('/end', (req, res) => {
			res.on('end', ()=> emitted.end++);
			res.sendStatus(200);
		});
		app.get('/json', (req, res) => {
			res.on('json', data => ({...data, bar: 2}));
			res.on('json', ()=> { emitted.json++; return undefined });
			res.send({foo: 1});
		});
		app.get('/sendfile', (req, res) => {
			res.on('sendFile', ()=> emitted.sendFile++);
			res.sendFile(__filename);
		});

		server = app.listen(port, null, finish);
	});

	after(()=> server && server.close());

	it('should not alter existing end-points', ()=>
		axios.get('/simple')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('event:end', ()=>
		axios.get('/end')
			.then(res => expect(emitted.end).to.be.equal(1))
	);

	it('event:json', ()=>
		axios.get('/json')
			.then(res => expect(res.data).to.be.deep.equal({foo: 1, bar: 2}))
			// .then(res => expect(emitted.json).to.be.equal(1))
	);

	it('event:sendFile', ()=>
		axios.get('/sendfile')
			.then(res => expect(emitted.sendFile).to.be.equal(1))
	);

});
