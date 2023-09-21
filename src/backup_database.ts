/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = require('child_process').exec
import cron from 'node-cron'
import fs from 'fs'
import dotenv from 'dotenv'
import moment from 'moment'
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
  // Get the current date
  const currentDate = moment();

  try {
    // Read the directory and filter files with the naming convention
    const files = fs.readdirSync(backupDir)
      .filter((filename) => /^.*?-\d{4}_\d{2}_\d{2}\.tar$/.test(filename));

    files.forEach((filename) => {
      const filePath = `${backupDir}/${filename}`;

      // Extract the date from the filename using regular expressions
      const match = filename.match(/^.*?-(\d{4})_(\d{2})_(\d{2})\.tar$/);
      if (match) {
        const [, yearStr, monthStr, dayStr] = match;
        const year = Number(yearStr);
        const month = Number(monthStr) - 1; // Months are zero-based
        const day = Number(dayStr);

        const fileDate = moment({ year, month, day });

        // Calculate the difference in days
        const daysDifference = currentDate.diff(fileDate, 'days');

        if (daysDifference > expire_after) {
          // Delete the file if it's older than expireAfter days
          fs.unlinkSync(filePath);
          console.log(`Deleted ${filename} as it is ${daysDifference} days old`);
        }
      }
    });
  } catch (error) {
    console.error(`Error reading or deleting files: ${error}`);
  }
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
