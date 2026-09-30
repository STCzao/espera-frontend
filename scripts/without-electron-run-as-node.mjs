import { spawn } from 'node:child_process'

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Missing command.')
  process.exit(1)
}

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const childCommand = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : command
const childArgs = process.platform === 'win32' ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args

const child = spawn(childCommand, childArgs, {
  env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error.message)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
