import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class SeaTalkApi implements ICredentialType {
	name = 'seaTalkApi';
	displayName = 'SeaTalk API';
	documentationUrl = 'https://open.seatalk.io/docs/';
	properties: INodeProperties[] = [
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'App Secret',
			name: 'appSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];

	// This allows n8n to show a "Connection Tested Successfully" green checkmark
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: 'https://openapi.seatalk.io/auth/app_access_token', // FIXED URL
			body: {
				app_id: '={{$credentials.appId}}',
				app_secret: '={{$credentials.appSecret}}',
			},
		},
	};
}