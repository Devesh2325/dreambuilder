# Take payments

Add a **Pay button** to any website or page, and connect it to a payment link from your payment provider. Visitors click it, pay on the provider's secure page, and the money goes straight to your account.

FlowPilot never sees card details, and doesn't handle the money, refunds or receipts. Your provider does all of that.

## Before you start

You need an account with a payment provider, such as Stripe, Razorpay or PayPal. If you don't have one yet, it usually takes the provider a little while to approve a new account, so sign up first.

## Add the button

1. Open your website or page in the editor.
2. Open **Add**, and drag **Pay button** to where you want it. You can also use the **Prices with pay buttons** section under **Sections**.
3. Fill in the **Button label**, such as Buy now, and the **Price shown beside it** if you want one.
4. Choose **Who takes the payment**. The steps for that provider appear below it.

## Get your payment link

### Stripe

1. Log in to Stripe, and open [Payment Links](https://dashboard.stripe.com/payment-links).
2. Choose **New**, then add your product name and price.
3. Choose **Create link**, then copy the link.

### Razorpay

1. Log in to Razorpay, and open [Payment Pages](https://dashboard.razorpay.com/app/paymentpages).
2. Choose **Create Payment Page**, then add your product and price.
3. Publish it, then copy the page link.

### PayPal

1. Log in to PayPal, and open [Payment links and buttons](https://www.paypal.com/buttons).
2. Create a payment link, then add your product and price.
3. Copy the link.

### Another provider

Any provider works if it gives you a hosted payment page with an address starting with `https://`.

Provider menus change from time to time, so if a name here looks different, search your provider's help for "payment link".

## Connect it

1. Paste the link into **Payment link** on the block.
2. Click **Preview**, then click your button to check that it opens the right page.
3. Publish.

The button doesn't show to visitors until it has a link, and the link must start with `https://`.

## Test it first

Most providers have a test mode. Create your link there first, pay with one of their test cards, and check what happens. When you're happy, create the real link and replace it on the button.

## After someone pays

The provider tells you and sends the customer a receipt. You can usually set a page for them to return to in the provider's link settings, so create a thank-you page in your website and paste its address there.

FlowPilot counts clicks on the button under **Analytics**, as **Pay button clicks**. It can't see whether the payment went through, so check your provider for sales.

## Several prices

Add one Pay button per product or plan, each with its own link. If you sell many products, a shop platform will serve you better than individual buttons.
