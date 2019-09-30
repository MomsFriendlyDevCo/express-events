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
		app.get('/return/foo', (req, res) => res.send({foo: 'Foo!'}));
		app.get('/return/bar', (req, res) => res.redirect('/return/foo'));
		app.get('/return/baz', (req, res) => res.redirect('/return/bar'));

		app.get('/undef/foo', (req, res) => { res.send({foo: 'Foo!'}) });
		app.get('/undef/bar', (req, res) => { res.redirect('/undef/foo') });
		app.get('/undef/baz', (req, res) => { res.redirect('/undef/bar') });


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

	it('should not alter existing end-points (JSON response, direct return)', ()=>
		axios.get('/return/foo')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response, direct return)', ()=>
		axios.get('/return/bar')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response x2, direct return)', ()=>
		axios.get('/return/baz')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (JSON response, undef return)', ()=>
		axios.get('/undef/foo')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response, undef return)', ()=>
		axios.get('/undef/bar')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response x2, undef return)', ()=>
		axios.get('/undef/baz')
			.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
	);

	it('should not alter existing end-points (redirect response x2, x100 hits, random timeouts)', ()=>
		Promise.all(
			Array.from(new Array(100))
				.map(()=>
					Promise.resolve()
						.then(()=> new Promise(resolve => setTimeout(resolve, Math.random() * 1000)))
						.then(()=> axios.get('/undef/baz'))
						.then(res => expect(res.data).to.be.deep.equal({foo: 'Foo!'}))
				)
		)
			.then(results => {
				expect(results).to.be.an('array');
				expect(results).to.have.length(100);
			})
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
