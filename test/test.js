var axios = require('axios');
var expect = require('chai').expect;
var express = require('express');
var expressEvents = require('..');

var port = process.env.PORT || 8080;

describe('Express-Events', ()=> {

	var server
	var emitted = {end: 0, json: 0, redirect: 0, sendFile: 0};
	before('setup basic express instance', finish => {
		axios.defaults.baseURL = `http://localhost:${port}`;

		var app = express();
		app.use(expressEvents());

		// Regular Express handlers
		app.get('/foo', (req, res) => res.send({foo: 'Foo!'}));
		app.get('/bar', (req, res) => res.redirect('/foo'));
		app.get('/baz', (req, res) => res.redirect('/bar'));


		// Event handler tests
		app.get('/end', (req, res) => {
			res.on('end', ()=> emitted.end++);
			res.sendStatus(200);
		});
		app.get('/json', (req, res) => {
			res.on('json', data => ({...data, bar: 2}));
			res.on('json', ()=> { emitted.json++; return undefined });
			res.send({foo: 1});
		});
		app.get('/redirect', (req, res) => {
			res.on('redirect', url => emitted.redirect++);
			res.redirect('/');
		});
		app.get('/sendfile', (req, res) => {
			res.on('sendFile', ()=> emitted.sendFile++);
			res.sendFile(__filename);
		});

		server = app.listen(port, null, finish);
	});

	after(()=> server && server.close());

	it('should not alter existing end-points (JSON response)', ()=>
		axios.get('/foo')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response)', ()=>
		axios.get('/bar')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response x2)', ()=>
		axios.get('/baz')
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

	it('event:redirect', ()=>
		axios.get('/redirect', {maxRedirects: 0})
			.then(res => expect.fail)
			.catch(res => {
				expect(emitted.redirect).to.be.equal(1)
				expect(res.response.status).to.be.equal(302);
			})
	);

	it('event:sendFile', ()=>
		axios.get('/sendfile')
			.then(res => expect(emitted.sendFile).to.be.equal(1))
	);

});
