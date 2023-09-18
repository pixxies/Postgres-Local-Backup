/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = require('child_process').exec
import cron from 'node-cron'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

import discord_webhook from './discord_webhook'

const host = process.env.PG_HOST
const username = process.env.PG_USER
const database = process.env.PG_DATABASE
const pgpsw = process.env.PG_PASSWORD
const discord_webhook_url = process.env.DISCORD_WEBHOOK
const expire_after: number = Number(process.env.DAYS_TO_KEEP) || 0
const backupDir = './backups'

// Create the backup filename
function filename(file_prefix: string) {
  const n = new Date()
  const d = n.getUTCDate()
  const m = n.getUTCMonth()
  const Y = n.getUTCFullYear()

  let D = d.toString()
  if (d < 10) D = '0' + D

  let M = (m + 1).toString()
  if (m < 10) M = '0' + M

  return `${file_prefix}-${Y}_${M}_${D}.tar`
}

// Runs on the cron schedule
function script() {
  if (!host || !database || !username || !pgpsw || !discord_webhook_url)
    return console.error('The .env file is missing some parameters')
  console.log(`Starting backup of ${filename(database)}...`)
  exec(
    `PGPASSWORD=${pgpsw} pg_dump -U ${username} -h ${host} -d ${database} -f ./backups/${filename(
      database
    )} -F t`,
    (error: any, stdout: any) => {
      if (error) {
        discord_webhook('fail', filename(database))
        return console.error(`Error creating backup:`, error)
      }
      console.log('Backup complete!', stdout)
      discord_webhook('success', filename(database))
      cleanupOldBackups()
    }
  )
}

// Delete old backups
function cleanupOldBackups() {
  if (expire_after === 0) return
  const now = new Date()
  const expireTimeout = new Date(
    now.getTime() - expire_after * 24 * 60 * 60 * 1000
  )
  fs.readdir(backupDir, (error: any, files: Array<any>) => {
    if (error) {
      console.error('Error reading backup directory:', error)
      return
    }
    files.forEach((file: any) => {
      const filePath = path.join(backupDir, file)
      fs.stat(filePath, (error: any, stats: { mtime: any }) => {
        if (error) {
          console.error(`Error checking file stats for ${filePath}:`, error)
          return
        }
        const fileModificationDate = stats.mtime // Get file modification date
        if (fileModificationDate < expireTimeout) {
          // If the file is older than expireTimeout, delete it
          fs.unlink(filePath, (error: any) => {
            if (error) {
              console.error(`Error deleting file ${filePath}:`, error)
            } else {
              console.log(`Deleted old backup file: ${filePath}`)
            }
          })
        }
      })
    })
  })
}

// Running backups daily at 11 am local time
function startSchedule() {
  cron.schedule(
    '0 0 11 * * *',
    () => {
      script()
    },
    {}
  )
}

export default startSchedule
