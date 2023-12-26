require('dotenv').config()
const fetch = require('cross-fetch')
const cron = require('node-cron')
const yaml = require('yaml')
const fs = require('fs')
const { ethers } = require("ethers");

FLUXMON_ABI = [
  "function latestTimestamp() view returns (uint256)",
]

async function loadConfig(yamlPath) {
  const yamlContents = await fs.promises.readFile(yamlPath, 'utf8')
  return yaml.parse(yamlContents)
}

async function notifyDiscord (discordURL, message) {
  return fetch(
    discordURL, 
      {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({content: message})}
  )
}   

async function notifyPhonecall (phonecallURL, message) {
  return fetch(
    phonecallURL, 
      {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({content: message})}
  )
}   

function findMinutesBeteenTxs(feed) {
  return (feed.minutesBeteenTxs || 60) + 1
}

async function getFluxMonLatestTimestamp(monitor, feed) {
  const provider = new ethers.providers.JsonRpcProvider(monitor.rpc_url);
  const contract = new ethers.Contract(feed.address, FLUXMON_ABI, provider);
  return contract.latestTimestamp()
}

async function main (cfg) {
  console.log('Running monitors...')
  for (const monitor of cfg.monitors) {
    console.log(monitor.name)
    for (const feed of monitor.feeds) {
      const contractAddress = feed.address;
      console.log(`Checking ${feed.code}...${contractAddress}`)  
      try {
        const latestTimestamp = await getFluxMonLatestTimestamp(monitor, feed)
        const timeSinceLastTx = new Date() - new Date(latestTimestamp*1000)
        const timeSinceLastTxInMinutes = timeSinceLastTx/1000/60
        const minutesBeteenTxs = findMinutesBeteenTxs(feed)
        if (timeSinceLastTxInMinutes > minutesBeteenTxs) {
            console.log(`${feed.code} is down. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
          if (monitor.notify_discord) {
            await notifyDiscord(cfg.discord_webhook_url, `${feed.code} is down. Last transaction was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
          }
          if (monitor.notify_phonecall) {
            await notifyPhonecall(cfg.phonecall_webhook_url, `${feed.code} is down. Last transaction was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
          }
        } else {
          console.log(`${feed.code} healthy. Last txn was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
          if (monitor.report_healthy) {
            await notifyDiscord(cfg.discord_webhook_url, `${feed.code} is healthy. Last transaction was ${Math.floor(timeSinceLastTxInMinutes)} minutes ago`)
          }
        }
      } catch (error) {
        await notifyDiscord(cfg.discord_webhook_url, `Unable to check ${feed.code}. ${error.message}`)
        console.error(error)
      }
    }
  }
}

async function run() {
  console.log(`Loading config from ${process.env.CONFIG_PATH}`)
  const cfg = await loadConfig(process.env.CONFIG_PATH)

  console.log(`Cron schedule: ${cfg.cron_schedule}`)
  cron.schedule(cfg.cron_schedule, () => {
    main(cfg).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });  
  });

}
run()
