import spawn from 'nano-spawn';

await spawn('gsutil', ['cp', './file.txt', 'gs://bucket/']);

await spawn('mycustombin');
