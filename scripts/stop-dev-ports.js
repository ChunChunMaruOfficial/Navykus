import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ports = ['3000', '3001', '4000'];

const run = (command, args) => {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).trim();
  } catch {
    return '';
  }
};

const stopWindows = () => {
  const script = `
    $ports = @(${ports.join(',')})
    $connections = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
      if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Output "stopped $processId"
      }
    }
  `;

  return run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
};

const stopUnix = () => {
  const output = run('sh', [
    '-c',
    `for port in ${ports.join(' ')}; do lsof -ti tcp:$port 2>/dev/null; done | sort -u`,
  ]);

  if (!output) return '';

  const processIds = output.split(/\s+/).filter(Boolean);
  for (const processId of processIds) {
    run('kill', ['-9', processId]);
  }

  return processIds.map((processId) => `stopped ${processId}`).join(os.EOL);
};

const result = process.platform === 'win32' ? stopWindows() : stopUnix();

console.log(result || 'No dev servers found on 3000, 3001, or 4000.');
