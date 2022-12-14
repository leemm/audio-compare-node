'use strict';

const cli = require('../index');

let ls = new cli([ 'plutil', '--help' ])
	.then(res => { if (res){ console.log('Success!', res); } })
	.catch(err => { if (err){ console.log('Failed!'); } });