'use strict';

const cli = require('../index');

let ls = new cli([ 'git', 'branch', '-a' ], null, { cwd: '/repos/app' })
    .then(res => { console.log('Success!', res); })
    .catch(err => { console.log('Failed!', err); });