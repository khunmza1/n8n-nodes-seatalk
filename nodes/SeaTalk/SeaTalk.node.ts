import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

export class SeaTalk implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'SeaTalk',
        name: 'seaTalk',
        icon: 'file:seatalkLogo.png',
        group: ['transform'],
        version: 1,
        description: 'Send messages or interactive cards via SeaTalk',
        defaults: { name: 'SeaTalk' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'seaTalkApi', required: true }],
        usableAsTool: true,
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [{ name: 'Message', value: 'message' }],
                default: 'message',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['message'] } },
                options: [
                    { name: 'Send Text Message', value: 'send', action: 'Send a standard text message' },
                    { name: 'Send Interactive Card', value: 'sendInteractive', action: 'Send a card with buttons' },
                ],
                default: 'send',
            },
            {
                displayName: 'Recipient Type',
                name: 'recipientType',
                type: 'options',
                options: [
                    { name: 'Group Chat', value: 'group' },
                    { name: 'Direct Message (Employee Code)', value: 'dm' },
                ],
                default: 'group',
            },
            {
                displayName: 'Recipient ID',
                name: 'recipientId',
                type: 'string',
                required: true,
                default: '',
                description: 'The Group ID or the Employee Code of the user',
            },
            {
                displayName: 'Reply to Thread',
                name: 'useThread',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Thread ID',
                name: 'threadId',
                type: 'string',
                default: '',
                displayOptions: { show: { useThread: [true] } },
                description: 'To reply in a thread, provide the thread ID here',
            },

            // --- Send Operation Fields ---
            {
                displayName: 'Message Text',
                name: 'text',
                type: 'string',
                default: '',
                displayOptions: { show: { operation: ['send'] } },
            },
            {
                displayName: 'Mention Everyone',
                name: 'mentionAll',
                type: 'boolean',
                default: false,
                displayOptions: { show: { operation: ['send'], recipientType: ['group'] } },
            },
            {
                displayName: 'Mentions (Emails)',
                name: 'mentionsUi',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                placeholder: 'Add User to Mention',
                displayOptions: { show: { operation: ['send'], recipientType: ['group'] } },
                default: {},
                options: [
                    {
                        name: 'emailValues',
                        displayName: 'Email',
                        values: [
                            { displayName: 'Email Address', name: 'email', type: 'string', default: '' },
                        ],
                    },
                ],
            },

            // --- Interactive Card Content ---
            {
                displayName: 'Title',
                name: 'title',
                type: 'string',
                default: '',
                displayOptions: { show: { operation: ['sendInteractive'] } },
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                typeOptions: { rows: 3 },
                default: '',
                displayOptions: { show: { operation: ['sendInteractive'] } },
            },
            {
                displayName: 'Card Image (Base64)',
                name: 'imageContent',
                type: 'string',
                default: '',
                displayOptions: { show: { operation: ['sendInteractive'] } },
            },
            {
                displayName: 'Vertical Buttons',
                name: 'individualButtonsUi',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                displayOptions: { show: { operation: ['sendInteractive'] } },
                default: {},
                options: [
                    {
                        name: 'buttonValues',
                        displayName: 'Button',
                        values: [
                            {
                                displayName: 'Type',
                                name: 'buttonType',
                                type: 'options',
                                options: [
                                    { name: 'Callback', value: 'callback' },
                                    { name: 'Redirect', value: 'redirect' },
                                ],
                                default: 'callback',
                            },
                            { displayName: 'Text', name: 'text', type: 'string', default: 'Button' },
                            { displayName: 'Value/URL', name: 'value', type: 'string', default: '' },
                        ],
                    },
                ],
            },
            {
                displayName: 'Horizontal Button Groups',
                name: 'buttonGroupsUi',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                displayOptions: { show: { operation: ['sendInteractive'] } },
                default: {},
                options: [
                    {
                        name: 'groupValues',
                        displayName: 'Group',
                        values: [
                            {
                                displayName: 'Buttons',
                                name: 'buttons',
                                type: 'fixedCollection',
                                typeOptions: { multipleValues: true },
                                default: {},
                                options: [
                                    {
                                        name: 'button',
                                        displayName: 'Button',
                                        values: [
                                            {
                                                displayName: 'Type',
                                                name: 'buttonType',
                                                type: 'options',
                                                options: [
                                                    { name: 'Callback', value: 'callback' },
                                                    { name: 'Redirect', value: 'redirect' },
                                                ],
                                                default: 'callback',
                                            },
                                            { displayName: 'Text', name: 'text', type: 'string', default: 'Action' },
                                            { displayName: 'Value/URL', name: 'value', type: 'string', default: '' },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const credentials = await this.getCredentials('seaTalkApi');
// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
        const authResponse = await this.helpers.httpRequest({
            method: 'POST',
            url: 'https://openapi.seatalk.io/auth/app_access_token',
            body: { app_id: credentials.appId, app_secret: credentials.appSecret },
            json: true,
        });
        const token = authResponse.app_access_token;

        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i) as string;
                const recipientType = this.getNodeParameter('recipientType', i) as string;
                const recipientId = this.getNodeParameter('recipientId', i) as string;
                const useThread = this.getNodeParameter('useThread', i) as boolean;
                const threadId = useThread ? (this.getNodeParameter('threadId', i) as string) : undefined;

                let messagePayload: any = {};

                const buildBtn = (btn: any) => {
                    const btnObj: any = { button_type: btn.buttonType, text: btn.text };
                    if (btn.buttonType === 'callback') {
                        btnObj.value = btn.value;
                    } else {
                        btnObj.mobile_link = { type: 'web', path: btn.value };
                        btnObj.desktop_link = { type: 'web', path: btn.value };
                    }
                    return btnObj;
                };

                if (operation === 'send') {
                    let text = this.getNodeParameter('text', i) as string;
                    if (recipientType === 'group') {
                        const mentionAll = this.getNodeParameter('mentionAll', i, false) as boolean;
                        const mentionsData = this.getNodeParameter('mentionsUi', i, {}) as any;
                        text = text.replace(/@all/g, '<mention-tag target="seatalk://all"/>');
                        text = text.replace(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g, '<mention-tag target="seatalk://user?email=$1"/>');
                        let mentionPrefix = '';
                        if (mentionAll && !text.includes('seatalk://all')) mentionPrefix += '<mention-tag target="seatalk://all"/> ';
                        const emails = (mentionsData.emailValues || []).map((m: any) => m.email).filter(Boolean);
                        emails.forEach((e: string) => { if (!text.includes(e)) mentionPrefix += `<mention-tag target="seatalk://user?email=${e}"/> `; });
                        text = (mentionPrefix + text).trim();
                    }
                    messagePayload = { tag: 'text', text: { format: 1, content: text } };
                } else if (operation === 'sendInteractive') {
                    const elements: any[] = [];
                    const title = this.getNodeParameter('title', i) as string;
                    const description = this.getNodeParameter('description', i) as string;
                    const imageContent = this.getNodeParameter('imageContent', i) as string;
                    const vButtonsData = this.getNodeParameter('individualButtonsUi', i) as any;
                    const hGroupsData = this.getNodeParameter('buttonGroupsUi', i) as any;
                    if (title) elements.push({ element_type: 'title', title: { text: title } });
                    if (description) elements.push({ element_type: 'description', description: { format: 1, text: description } });
                    if (imageContent) elements.push({ element_type: 'image', image: { content: imageContent } });
                    const vButtons = vButtonsData.buttonValues || [];
                    if (vButtons.length > 5) throw new Error(`Max 5 Vertical Buttons allowed.`);
                    vButtons.forEach((btn: any) => elements.push({ element_type: 'button', button: buildBtn(btn) }));
                    const hGroups = hGroupsData.groupValues || [];
                    if (hGroups.length > 3) throw new Error(`Max 3 Horizontal Groups allowed.`);
                    hGroups.forEach((group: any) => {
                        const btns = group.buttons?.button || [];
                        if (btns.length > 3) throw new Error(`Max 3 buttons per group.`);
                        elements.push({ element_type: 'button_group', button_group: btns.map((b: any) => buildBtn(b)) });
                    });
                    messagePayload = { tag: 'interactive_message', interactive_message: { elements } };
                }

                if (threadId) {
                    messagePayload.thread_id = threadId;
                }

                // ==========================================
                // STRICT DOC COMPLIANCE: Always use employee_code for DMs
                // ==========================================
                const body: any = { message: messagePayload };
                if (recipientType === 'group') {
                    body.group_id = recipientId;
                } else {
                    body.employee_code = recipientId;
                }
// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
                const responseData = await this.helpers.httpRequest({
                    method: 'POST',
                    url: recipientType === 'group' ? 'https://openapi.seatalk.io/messaging/v2/group_chat' : 'https://openapi.seatalk.io/messaging/v2/single_chat',
                    headers: { Authorization: `Bearer ${token}` },
                    body,
                    json: true,
                });

                returnData.push({ json: responseData });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}