const { execSync } = require('child_process');
const git = '"C:\\Program Files\\Git\\cmd\\git.exe"';

function run(cmd) {
  try {
    const out = execSync(`${git} ${cmd}`, { stdio: 'pipe' }).toString();
    console.log(cmd + ':', out.trim());
  } catch (err) {
    console.error('Error on ' + cmd + ':', err.stderr ? err.stderr.toString() : err.message);
  }
}

run('init -b main');
run('config user.name "Glamora Editorial"');
run('config user.email "editorial@glamora.com"');
run('add .');
run('commit -m "feat: Glamora Editorial Luxury Platform v1.0"');
run('status -s');
