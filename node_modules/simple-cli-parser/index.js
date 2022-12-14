'use strict';

const spawn = require('child_process').spawn;

class cli {

    /**
     * Spawn external process and return piped result
     * @private
     * @param  {Array}  cmd
     * @param  {Function}  onData // if need to track status of stderr (curl downloads etc.)
     * @param  {Object}  options // optional, if provided, 
     * @return {Promise}
     */
    constructor(cmd, onData, options = {}) {

    	// Get parameters
        if (!Array.isArray(cmd)){ cmd = [ cmd ]; }

        let first = cmd[0], res = [], finalResult;
        cmd.shift();

        const proc = spawn(first, cmd, options);

        // Spawn request

        proc.stderr.on('data', (data) => {
            if (onData){
                res.push(data.toString().split('\n')[0]);
                onData(res[res.length - 1]);
            }else{
                res = res.concat(data.toString().split('\n'));
            }
        });

        return new Promise((resolve, reject) => {

            proc.stdout.on('data', (data) => {
                finalResult = data.toString();
            });

            proc.on('close', (code) => {
                resolve(finalResult || res.join('\n'));
            });

            proc.on('error', (err) => {

                if (!err){ err = { code: '' }; }

                switch (err.code){
                    case 'ENOENT':
                        reject(new Error(`ENOENT thrown; '${first}' does not exist or is not in $PATH`));
                        break;
                    default:
                        reject(new Error('Unknown error occured'));
                        break;
                }

            });

        });

    }

}

module.exports = cli;