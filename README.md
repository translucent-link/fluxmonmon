# Fluxmonmon

Version 2.0 introduces a new and more flexible configuration file format using YAML. 

        cron_schedule: "*/5 * * * *"
        discord_webhook_url: "https://discord.com/api/webhooks/..."
        phonecall_webhook_url: "https://xxxxxxxxxxxxxxxx.pipedream.net"
        monitors:
        - name: "Arbitrum Sepolia Monitor"
        etherscan_api_key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        etherscan_api:  "https://api-sepolia.arbiscan.io/api"
        report_healthy: false
        notify_discord: true
        feeds:
        - code: fluxmon-feed1
            address: "0x91F9C89891575C2E41edfFB5953565A9aE2Dbd9C"
            minutesBeteenTxs: 45
        - code: fluxmon-feed2
            address: "0x667a18Ef90fe4DCF4f86B8471931A3e498fAD3BC"
        - name: "Arbitrum Monitor"
        etherscan_api_key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        etherscan_api:  "https://api.arbiscan.io/api"
        report_healthy: false
        notify_discord: true
        notify_phonecall: true
        feeds:
        - code: fluxmon-feed3
            address: "0x91F9C89891575C2E41edfFB5953565A9aE2Dbd9C"

A monitor observes a collection of feeds on a specific chain, e.g. Arbitrum or Sepolia. Each feed is a contract address and a code. The code is used to identify the feed in the notification messages.

The `cron_schedule` is used to schedule the monitor to run. The `discord_webhook_url` is used to send notifications to a Discord channel. The `phonecall_webhook_url` is used to send notifications to a phone number using [Pipedream](https://pipedream.com/).

The `report_healthy` flag is used to send a notification when the feed is healthy - hardly used because it does get noisy. 

The `notify_discord` flag is used to send notifications to Discord and should be used always.

The `notify_phonecall` flag is used to call a phone number - this is a paid service and should be used only for critical notifications - those you get out of bed for in the middle of the night.

# Run the container

    docker run --rm -it -e CONFIG_PATH=/cfg/config.yml -v ./conf:/cfg fluxmonmon
