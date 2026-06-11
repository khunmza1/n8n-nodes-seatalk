import {
    IWebhookFunctions,
    IWebhookResponseData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

export class SeaTalkTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'SeaTalk Trigger',
        name: 'seaTalkTrigger',
        icon: 'file:seatalkLogo.png',
        group: ['trigger'],
        version: 1,
        description: 'Starts the workflow when a SeaTalk message is received',
        defaults: { name: 'SeaTalk Trigger' },
        inputs: [],
        outputs: ['main'],
        webhooks: [
            {
                name: 'default',
                httpMethod: 'POST',
                responseMode: 'responseNode', 
                path: 'webhook',
            },
        ],
        properties: [],
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const bodyData = this.getBodyData() as any;

        // 1. THE HANDSHAKE (FLAT RESPONSE)
        if (bodyData.event_type === 'event_verification') {
            return { webhookResponse: bodyData.event };
        }

        const event = bodyData.event;
        const eventType = bodyData.event_type;
        const messageTag = event?.message?.tag;

        // DEEP EXTRACTION: Find the sender in group mentions or DMs
        const sender = event?.message?.sender || event?.sender || {};
        const seatalkId = sender.seatalk_id || event?.seatalk_id || '';
        const employeeCode = sender.employee_code || event?.employee_code || '';
        const email = sender.email || event?.email || '';

        const groupId = event?.group_id || '';
        const isGroup = !!groupId;
        const msgId = event?.message?.message_id || event?.message_id || '';
        const thrId = event?.thread_id || event?.message?.thread_id || '';
        
        // 2. DATA NORMALIZATION (LOGICAL SENDER/CHAT)
        let normalizedOutput: any = {
            // Who sent it?
            senderId: seatalkId,        
            senderEmployeeCode: employeeCode, 
            senderEmail: email,

            // Where did it happen?
            chatId: isGroup ? groupId : seatalkId, 
            chatType: isGroup ? 'group' : 'dm',

            // Message specifics
            parentThreadId: thrId || msgId, 
            messageId: msgId,
            event_id: bodyData.event_id,
            event_type: eventType,
            app_id: bodyData.app_id,
            event: event, 
            raw: bodyData, 
        };

        // 3. INTERACTION TYPE & TEXT
        if (messageTag === 'image') {
            normalizedOutput.imageUrl = event.message.image?.content || '';
            normalizedOutput.interactionType = 'image_message';
            normalizedOutput.msgText = '[Image Received]';
        } else if (eventType === 'interactive_message_click') {
            normalizedOutput.interactionType = 'button_click';
            normalizedOutput.actionValue = event.value;
            normalizedOutput.msgText = `Button clicked: ${event.value}`;
        } else {
            normalizedOutput.interactionType = 'text_message';
            normalizedOutput.msgText = event.message?.text?.plain_text || event.message?.text?.content || '';
        }

        return {
            workflowData: [this.helpers.returnJsonArray(normalizedOutput)],
        };
    }
}