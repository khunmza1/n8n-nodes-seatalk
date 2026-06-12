# n8n-nodes-seatalk

This is an n8n community node that lets you interact with the [SeaTalk Open Platform](https://open.seatalk.io). It allows you to send text messages, rich interactive cards, and trigger workflows based on incoming SeaTalk events and button clicks.

## Features
* **Send Text & Interactive Cards:** Send formatted rich text, @mentions, and interactive cards with buttons.
* **Thread Routing:** Reply directly to existing conversations.
* **SeaTalk Trigger:** Listen for real-time webhooks directly from SeaTalk with built-in handshake verification.

## Prerequisites

To use this node, you need a SeaTalk Open Platform account and an active application.

1. Go to the [SeaTalk Developer Center](https://open.seatalk.io).
2. Create a new Application (or select an existing one).
3. Navigate to **App Settings > App Credentials**.
4. Copy your **App ID** and **App Secret**. You will need these for the n8n credentials setup.
5. Ensure your app has the correct **Bot & Messaging** permissions enabled.

## Webhook Setup (For the Trigger Node)

SeaTalk requires you to manually register your webhook URL in their developer console. n8n cannot do this automatically.

1. In n8n, add the **SeaTalk Trigger** node to your canvas.
2. Open the node and copy the **Test Webhook URL** (or Production Webhook URL).
3. Go back to your SeaTalk Developer Console.
4. Navigate to **Event Subscriptions**.
5. Paste your n8n Webhook URL into the **Callback URL** field and save. 
*(Note: Your n8n instance must be accessible from the public internet for SeaTalk to reach it).*

## Example Usage

### Send a standard message
1. Add the **SeaTalk** node to your canvas.
2. Select **Message** as the Resource and **Send Text Message** as the Operation.
3. Choose **Group Chat** or **Direct Message**.
4. Enter the recipient ID (Group ID or Employee Code) and your message text.
5. Execute the node.

### Create an Interactive Card Workflow
1. Use the **SeaTalk Trigger** node to listen for incoming messages.
2. Connect it to a **SeaTalk** node configured to **Send Interactive Card**.
3. Add Vertical Buttons or Horizontal Button Groups to the card.
4. When a user clicks a button, the SeaTalk Trigger node will fire again with an `interactive_message_click` event containing the button's value.

## License
[MIT](LICENSE)

## Installation
In your n8n instance, go to **Settings > Community Nodes**, click **Install a community node**, and enter `n8n-nodes-seatalk`.