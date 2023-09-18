import dotenv from 'dotenv'
dotenv.config()

function discord_webhook(state: 'success' | 'fail', filename: string) {
  const discord_webhook_url = process.env.DISCORD_WEBHOOK

  if (!discord_webhook_url)
    return console.error('Discord webhook URL not configured in .env file')

  const success_message = {
    embed: {
      title: ':green_circle: Backup complete!',
      description: `<:greentick:678397805454295079> Backup \`${filename}\` created!`,
      color: 5793266,
    },
  }

  const fail_message = {
    embed: {
      title: ':red_circle: Backup Failed!',
      description: `<:redtick:678397805458620461> Backup \`${filename}\` failed!\n\n:warning: ***Please check your error logs!***`,
      color: 5793266,
    },
  }

  const message = state === 'success' ? success_message : fail_message

  fetch(discord_webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: process.env.DISCORD_USERNAME,
      content: '<@' + process.env.DISCORD_PING_ID + '>',
      embeds: [message.embed],
    }),
  })
}

export default discord_webhook
