# Your own domain

A published website or page always has a FlowPilot address. You can also show it at your own domain, such as `www.yourbusiness.com`.

## If you don't have a domain yet

Buy one from a domain seller, such as Cloudflare, Namecheap, GoDaddy, Hostinger or Squarespace Domains. It usually costs a small amount each year. You don't need their website builder, email or hosting extras. FlowPilot doesn't sell domains, and isn't paid by any seller.

Pick something short that's easy to say and spell. A `.com`, or your country's ending such as `.in` or `.co.uk`, is easiest for people to trust.

## Connect it

1. Publish your website or page.
2. Open the project, then **Share and install**, then **Use your own domain**.
3. Type your domain and click **Add domain**. Most people use the `www` version, such as `www.yourbusiness.com`.
4. Sign in where you bought the domain, and open its **DNS** settings. Add the two records FlowPilot shows you:
   - an **A** record for a domain without `www`, or a **CNAME** record for one with it. This sends visitors to your site.
   - a **TXT** record starting `flowpilot-verify=`. This proves the domain is yours, so nobody else can connect it.
5. Back in FlowPilot, click **Check my DNS settings**. Each record shows **Found** once the internet can see it.
6. Click **Connect domain**.

DNS changes usually show within an hour, and can take up to a day. Before adding the records, delete any older A or CNAME record for the same name, or some visitors will still reach your old site.

To use both `yourbusiness.com` and `www.yourbusiness.com`, add each one. A site can have up to three domains.

## After it's connected

The domain shows your latest published version. Publish changes as usual, and they appear there too. Pages keep their addresses, so `www.yourbusiness.com/contact` opens your Contact page.

## If it doesn't connect

- **"We couldn't find the TXT record"**: wait a little longer, and check the record's name and value were copied exactly. Some sellers add your domain to the name for you, so enter only the part FlowPilot shows.
- **"Your domain doesn't point to FlowPilot yet"**: check the A or CNAME record, and remove any older one for the same name.
- **"Custom domains are not set up on this FlowPilot yet"**: whoever runs your FlowPilot needs to finish its hosting setup. Ask them, or contact support.

In demo mode you can add a domain and see its records, but connecting it needs the live setup.
