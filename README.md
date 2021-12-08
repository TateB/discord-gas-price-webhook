# discord gas price webhook

very simple gas price tracker that sends to a discord webhook whenever gas is below a certain value.  
based on the [cloudflare worker template](https://github.com/cloudflare/worker-template).

# how to use

rename wrangler.template.toml to wrangler.toml and fill out all the empty fields

```sh
wrangler kv:namespace create "KV_DATA"
# add the result to your wrangler.toml
```

```sh
wrangler secret put ETHERSCAN_API_KEY
# enter your etherscan API key
```

```sh
wrangler secret put DISCORD_WEBHOOK_URL
# enter your discord webhook url
```

```sh
wrangler publish
```