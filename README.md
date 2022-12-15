A port of [https://github.com/kdave/audio-compare](https://github.com/kdave/audio-compare) to nodejs, to use in your own applications.

# Requirements

You will need _fpcalc_, part of _chromaprint_.

[https://command-not-found.com/fpcalc](https://command-not-found.com/fpcalc)

# Install
```
npm install audio-compare --save
```

# Usage

```javascript
import { compare } from 'audio-compare';

console.log(await compare({
    source: '/Users/kurt/Downloads/smellsliketeenspirit2.wav',
    dest: '/Users/kurt/Downloads/smellsliketeenspirit.wav',
}));

/**
 * match = percentage match of each audio file
 * 
 * {
 *   max_corr_index: 100,
 *   max_corr_offset: 0,
 *   source: '/Users/lemccorm/Downloads/smellsliketeenspirit2.wav',
 *   target: '/Users/lemccorm/Downloads/smellsliketeenspirit.wav',
 *   match: 72.27704678362574
 * }
 */
```