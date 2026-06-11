import { SeaTalk } from './nodes/SeaTalk/SeaTalk.node';
import { SeaTalkTrigger } from './nodes/SeaTalk/SeaTalkTrigger.node'; // ADD THIS
import { SeaTalkApi } from './credentials/SeaTalkApi.credentials';

export const nodes = [
	SeaTalk,
	SeaTalkTrigger, // ADD THIS
];

export const credentials = [
	SeaTalkApi,
];