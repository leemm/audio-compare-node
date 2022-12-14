'use strict';

const cli = require('../index'),
	currentPercentage = data => { // Optional function for checking status
		let percent = parseFloat(data, 10);
		if (!isNaN(percent) && percent > 0){ console.log(percent + '%'); }
	};

let download = new cli([ 'curl', '-O', 'http://speedtest.ftp.otenet.gr/files/test10Mb.db', '-#' ], currentPercentage)
	.then(res => { if (res){ console.log('Success!', res); } })
	.catch(err => { if (err){ console.log('Failed!'); } });