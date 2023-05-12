require('dotenv').config()
const fetch = require('cross-fetch')
const cron = require('node-cron')

const notifyDiscord = async (message) => fetch(
    process.env.DISCORD_WEBHOOK_URL, 
    {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({content: message})}
  )  

const main = async () => {
  console.log(process.env.FEEDS)
  const feeds = JSON.parse(process.env.FEEDS)
  
  for (const feedName of Object.keys(feeds)) {
    const contractAddress = feeds[feedName];
    console.log(`Checking ${feedName}...${contractAddress}`)
    const url = `${process.env.ETHERSCAN_API}?module=account&action=txlist&address=${contractAddress}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`

    try {
      const response = await fetch(url)
      const data = await response.json()
      const txnDates = data.result.map((result) => new Date(parseInt(result.timeStamp, 10)*1000))
      const timeSinceLastTx = new Date() - txnDates[0]
      const timeSinceLastTxInMinutes = timeSinceLastTx/1000/60
      if (timeSinceLastTxInMinutes > 61) {
        console.log(`${feedName} is down. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
        await notifyDiscord(`${feedName} is down. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
      } else {
        console.log(`${feedName} healthy. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
        if (process.env.REPORT_HEALTHY === 'true') {
          await notifyDiscord(`${feedName} is healthy. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
        }
      }
    } catch (error) {
      await notifyDiscord(`Unable to check ${feedName}. ${error.message}`)
      console.error(error)
    }
  }

}

console.log(`Cron schedule: ${process.env.CRON_SCHEDULE}`)
cron.schedule(process.env.CRON_SCHEDULE, () => {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });  
});