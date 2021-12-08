addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event))
})

const convertToPriceEstimates = (estimate, gasPrice, ethUsdPrice) => {
  const etherEstimate = (estimate * gasPrice) / 1000000000
  const usdEstimate = etherEstimate * ethUsdPrice

  return {  etherEstimate, usdEstimate }
}

const generateDiscordEmbed = (gasPrice, ethEstRegistration, ethEstRenewal) => ({
  content: "<@&" + DISCORD_ROLE_ID + "> Gas price is currently " + gasPrice + " gwei!",
  embeds: [
    {
      title: "Gas Alert!",
      url: "https://etherscan.io/gastracker",
      description: "Gas price went below " + TARGET_GAS_PRICE + " gwei.",
      fields: [
        {
          name: "Gas Price",
          value: `${gasPrice} gwei`,
        },
        {
          name: "Registration Gas Cost",
          value: `${ethEstRegistration.etherEstimate.toFixed(3)} ETH ($${ethEstRegistration.usdEstimate.toFixed(2)} USD)`,
          inline: true,
        },
        {
          name: "Renewal Gas Cost",
          value: `${ethEstRenewal.etherEstimate.toFixed(3)} ETH ($${ethEstRenewal.usdEstimate.toFixed(2)} USD)`,
          inline: true,
        }
      ],
      footer: {
        text: "Powered by Etherscan.io APIs"
      }
    }
  ]
})

async function handleScheduled(event) {
  const timeSinceLastMention = await KV_DATA.get('last-mention-time').then((res) => parseInt(res))
  if (!isNaN(timeSinceLastMention)) {
    const minutesSinceLastMention = ((Date.now() - timeSinceLastMention) / 1000) / 60
    if (MINIMUM_MINUTES_INTERVAL > minutesSinceLastMention) return
  }

  const etherscanApiUrl = 'https://api.etherscan.io/api?'
  const gasPriceData = await fetch(etherscanApiUrl + "module=gastracker&action=gasoracle&apikey=" + ETHERSCAN_API_KEY).then((res) => res.json())
  const gasPrice = gasPriceData.result.ProposeGasPrice
  if (gasPrice >= TARGET_GAS_PRICE) return
  const ethPriceData = await fetch(etherscanApiUrl + "module=stats&action=ethprice&apikey=" + ETHERSCAN_API_KEY).then((res) => res.json())
  const ethUsdPrice = ethPriceData.result.ethusd

  const [ethEstRegistration, ethEstRenewal] = [
    convertToPriceEstimates(GAS_ESTIMATE_REGISTRATION, gasPrice, ethUsdPrice), 
    convertToPriceEstimates(GAS_ESTIMATE_RENEWAL, gasPrice, ethUsdPrice)
  ]

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      body: JSON.stringify(generateDiscordEmbed(gasPrice, ethEstRegistration, ethEstRenewal)),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    await KV_DATA.put('last-mention-time', `${Date.now()}`)
  } catch (e) {
    console.error(e)
  }
  return
}
