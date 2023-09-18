# Postgres Local Backups

## Create regular Postgres database backups on your local machine and get pinged on Discord when they run!

### Features

- Dumps your remote Postgres database into a `backups` directory on your local machine.
- Sends you notifications in a Discord channel through a webhook.
- Automatically deletes old backups after a certain number of days to clear space on your local disk.

### System requirements

- Node.js v18 or higher.
- Recommended: PM2 to run the process.

**Note:** This does require your local machine being turned on, the process to be running and a stable internet connection to work. If the backup fails at the pre-defined backup time, it won't run again until the following day.

### Installation

```
git clone https://github.com/pixxies/Postgres-Local-Backup.git
npm install
```

Change the values in `sample.env` to your details and rename the file to `.env`.

```env
PG_HOST="my.host.tld"
PG_PORT="5432"
PG_USER="admin"
PG_PASSWORD="1234567890"
PG_DATABASE="my_database"
DISCORD_WEBHOOK="" // https://discord.com/api/webhooks/...
DISCORD_USERNAME="My Cool Bot" // The webhook's name in Discord
DISCORD_PING_ID="643945264868098049"
DAYS_TO_KEEP="7" // Set to "0" to never expire - this may fill your disk space quickly
```

You'll need to create a Discord webhook in a channel and paste the link into the `.env` file above.

The `DISCORD_PING_ID` is the Discord ID of the person the webhook will ping for notifications. You can make the webhook ping a role instead by prefixing a role ID with `&`, for example `&761916863847333928`.

Set the number of days to keep old dumps with the `DAYS_TO_KEEP` value in your `.env` file. To never delete old backups, set this value to 0.

### Startup

1. Open a new terminal window in your project directory.
2. Run `npm run build && pm2 start npm --name "postgres-local-backups" -- start`.
3. You'll recieve confirmation of startup and all events in the logs. Run `pm2 logs postgres-local-backups` to see the logs.
