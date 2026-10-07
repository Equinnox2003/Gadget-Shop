// This launcher runs only the project in its own folder.
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { spawn, spawnSync } = require('node:child_process');

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('Install Node.js 24 LTS from https://nodejs.org/ and run this launcher again.');
  process.exit(1);
}
const title = 'Gadget Shop';
const port = 8083;
function run(command, args) {
  return new Promise((resolve, reject) => {
    const isWindowsCommand = process.platform === 'win32' && /\.cmd$/i.test(command);
    const child = spawn(isWindowsCommand ? `"${command}" ${args.join(' ')}` : command,
      isWindowsCommand ? [] : args, {
      cwd: __dirname,
      stdio: 'inherit',
      shell: isWindowsCommand,
      windowsHide: true,
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0 || signal === 'SIGINT' || signal === 'SIGTERM') resolve();
      else reject(new Error(`Command exited with code ${code}.`));
    });
  });
}
function findNpmCommand() {
  if (process.platform !== 'win32') return 'npm';

  const candidates = [...new Set((process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean)
    .map((directory) => path.join(directory, 'npm.cmd')))]
    .filter((candidate) => fs.existsSync(candidate));

  for (const candidate of candidates) {
    const result = spawnSync(`"${candidate}" --version`, [], {
      shell: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    if (result.status === 0) return candidate;
  }

  throw new Error('No working npm installation was found on PATH. Repair or reinstall Node.js, then try again.');
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--browser', '--source', '--no-open'].includes(arg))
    || (args.includes('--browser') && args.includes('--source'))) {
    throw new Error('Usage: node start.cjs [--browser|--source] [--no-open]');
  }
  console.log(`\n${title} - LAB 05\n`);
  let mode = args.includes('--browser') ? '1' : args.includes('--source') ? '2' : undefined;
  if (!mode) {
    const input = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('1. Run the included laptop browser build (no npm install)\n2. Run this source project for Expo Go / editing\n');
    try { mode = (await input.question('Choose a mode (Enter for 1): ')).trim() || '1'; }
    finally { input.close(); }
  }
  if (!['1', '2'].includes(mode)) throw new Error('Choose mode 1 or 2.');
  if (mode === '1') {
    const serverArgs = [path.join(__dirname, 'serve.cjs'), String(port)];
    if (args.includes('--no-open')) serverArgs.push('--no-open');
    await run(process.execPath, serverArgs);
  } else {
    const npm = findNpmCommand();
    if (!fs.existsSync(path.join(__dirname, 'node_modules', 'expo', 'package.json'))) {
      console.log('\nInstalling this project\'s locked dependencies. Internet is needed for this first step.\n');
      await run(npm, ['ci']);
    }
    await run(npm, ['start', '--', '--port', String(port)]);
  }
}
main().catch((error) => { console.error(`\n${error.message}`); process.exitCode = 1; });
