import startSchedule from './backup_database'
import { exit } from 'node:process'

const host = process.env.PG_HOST
const username = process.env.PG_USER
const database = process.env.PG_DATABASE
const pgpsw = process.env.PG_PASSWORD
const discord_webhook_url = process.env.DISCORD_WEBHOOK
const expire_after: number = Number(process.env.DAYS_TO_KEEP) || 0

if (
  !host ||
  !database ||
  !username ||
  !pgpsw ||
  !discord_webhook_url ||
  !expire_after
)
  throw Error(
    'The .env file is missing some parameters! Please check your .env file and try again.'
  )
exit(1)

startSchedule()

console.log(`Local Postgres Backups initialised!\n
|--> Saving backups from the ${database} database.\n
|--> ${
  expire_after > 0
    ? `Expiring backups after ${expire_after} days`
    : `Old backups will never expire. Please note this may fill your disk space causing newer backups to fail!`
}`)
