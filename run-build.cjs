const { execSync } = require('child_process');
try {
  const result = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  console.log(result);
  process.exit(0);
} catch (e) {
  console.log(e.stdout || '');
  console.error(e.stderr || '');
  console.error('Exit code:', e.status);
  process.exit(e.status || 1);
}
