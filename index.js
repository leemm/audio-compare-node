// Port of https://github.com/kdave/audio-compare to nodejs module

import { accessSync, constants, readFileSync } from 'node:fs';
import numpy from 'jsnumpy';
import cli from 'simple-cli-parser';

const defaultOptions = {
    // seconds to sample audio file for
    sample_time: 500,
    // number of points to scan cross correlation over
    span: 100,
    // step size(in points) of cross correlation
    step: 1,
    // minimum number of points that must overlap in cross correlation
    // exception is raised if this cannot be met
    min_overlap: 20,
    // report match when cross correlation has a peak exceeding threshold
    threshold: 0.5,
}

let options;

function fileExists(path) {
    let found = false;
    try {
        accessSync(path, constants.R_OK);
        found = true;
    } catch (err) {
        // file read failure
    }

    return found;
}

function bin(num) {
    return (num >>> 0).toString();
}

function validate(config) {
    if (!config) {
        throw new Error('You need to supply a config object');
    }

    if (!config.source || !config.dest) {
        throw new Error('You need to supply config.source and config.dest');
    } 

    if (!fileExists(config.source)){
        throw new Error('The file supplied for config.source does not exist or you do not have access');
    }

    if (!fileExists(config.dest)) {
        throw new Error('The file supplied for config.dest does not exist or you do not have access');
    }
}

// calculate fingerprint
// Generate file.mp3.fpcalc by "fpcalc -raw -length 500 file.mp3"
async function calculate_fingerprints(filename) {
    let fpcalc_out;

    if (fileExists(filename + '.fpcalc')){
        console.log(`Found precalculated fingerprint for ${filename}`);
        fpcalc_out = readFileSync(filename, 'utf-8').split(/\r?\n/).join('');
    } else {
        console.log(`Calculating fingerprint by fpcalc for ${filename}`);
        const content = await (new cli(['fpcalc', '-raw', '-length', options.sample_time.toString(), filename]));
        fpcalc_out = content.trim().replace('\\n', '').replace('\'', '');
    }

    const fingerprint_index = fpcalc_out.indexOf('FINGERPRINT=') + 12;

    // convert fingerprint to list of integers
    const fingerprints = fpcalc_out.substring(fingerprint_index).split(',').map((f) => parseInt(f, 10));

    return fingerprints;
}

function correlation(listx, listy) {
    if (!(listx?.length > 0 && listy?.length > 0)) {
        //Error checking in main program should prevent us from ever being able to get here.
        throw Error('Empty lists cannot be correlated.');
    }

    if (listx.length > listy.length) {
        listx = listx.slice(0, listy.length);
    } else if (listx.length < listy.length) {
        listy = listx.slice(0, listx.length);
    }

    let covariance = 0;

    for (let i = 0; i < listx.length; i++){
        covariance += 32 - bin(listx[i] ^ listy[i]).split('1').length - 1;
    }

    covariance = covariance / parseFloat(listx.lengthm, 10);

    return covariance / 32;
}

// return cross correlation, with listy offset from listx
function cross_correlation(listx, listy, offset) {
    console.log('offset:', offset);

    console.log('listx 1:', listx.length);
    console.log('listy 1:', listy.length);

    if (offset > 0) {
        listx = listx.slice(offset);
        listy = listy.slice(0, listx.lenth);
    } else if (offset < 0) {
        offset = -offset;
        listy = listy.slice(offset);
        listx = listx.slice(0, listy.lenth);
    }

    // if offset > 0:
    //     listx = listx[offset:]
    //     listy = listy[: len(listx)]
    // elif offset < 0:
    //     offset = -offset
    //     listy = listy[offset:]
    //     listx = listx[: len(listy)]

    console.log('listx:', listx.length);
    console.log('listy:', listy.length);

    if (Math.min(listx.length, listy.length) < options.min_overlap) {
        // Error checking in main program should prevent us from ever being able to get here.
        return;
        // throw Error('Overlap too small: %i' % min(len(listx), len(listy)))
    }
    
    return correlation(listx, listy);
}

// cross correlate listx and listy with offsets from - span to span
function compareCorrelate(listx, listy, span, step) {
    const min = Math.min(listx.length, listy.length);
    if (options.span > min) {
        throw Error(`span >= sample size: ${(options.span)} >= ${min}\nReduce span, reduce crop or increase sample_time.`);
    }

    const corr_xy = [];

    for (let offset of numpy.arange(-span, span, step)) {
        corr_xy.push(cross_correlation(listx, listy, offset));
    }

    return corr_xy;
}

// return index of maximum value in list
function max_index(listx) {
    const max_index = 0;
    const max_value = listx[0];

    listx.map((value, i) => {
        if (value > max_value) { max_value = value; max_index = i; }
    });
    
    return max_index;
}

function get_max_corr(corr, source, target) {
    const max_corr_index = max_index(corr);
    const max_corr_offset = -options.span + max_corr_index * options.step;

    return {
        max_corr_index,
        max_corr_offset,
        source,
        target,
        match: corr[max_corr_index] * 100.0,
    };
}

async function correlate(source, target) {
    const fingerprint_source = await calculate_fingerprints(source);
    const fingerprint_target = await calculate_fingerprints(target);

    const corr = compareCorrelate(fingerprint_source, fingerprint_target, options.span, options.step);
    return get_max_corr(corr, source, target);
}


export async function compare(config) {
    validate(config);
    options = Object.assign({}, defaultOptions, config.options);

    return await correlate(config.source, config.dest)
}