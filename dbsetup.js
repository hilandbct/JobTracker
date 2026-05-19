#!/usr/bin/env node
// Fly.io startup: run migrations then start the server.
// The app is pre-built in the Docker image — no rebuild at runtime.

const { spawn } = require('node:child_process')
const env = { ...process.env }

;(async () => {
  await exec('npx prisma migrate deploy')
  await exec(process.argv.slice(2).join(' '))
})()

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} failed rc=${code}`))
    })
  })
}
