export const PRODUCT_HEADERS = [
    'id',
    'name',
    'hpp',
    'marketplace',
    'categoryGroup',
    'categoryName',
    'payloadJson',
    'createdAt',
    'updatedAt'
];

export const HISTORY_HEADERS = [
    'id',
    'productName',
    'marketplace',
    'sellingPrice',
    'hpp',
    'profit',
    'margin',
    'payloadJson',
    'createdAt'
];

export const SCENARIO_HEADERS = [
    'id',
    'label',
    'name',
    'payloadJson',
    'createdAt',
    'updatedAt'
];

export const SETTINGS_HEADERS = ['key', 'value', 'updatedAt'];
export const SYNC_LOG_HEADERS = ['event', 'detail', 'createdAt'];

function stringifyPayload(value) {
    return JSON.stringify(value ?? null);
}

function parsePayloadJson(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function valueAt(record, ...keys) {
    for (const key of keys) {
        if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
    }
    return '';
}

export function productsToRows(products = []) {
    return [
        PRODUCT_HEADERS,
        ...products.map(product => [
            valueAt(product, 'id', 'productId'),
            valueAt(product, 'name', 'productName'),
            valueAt(product, 'hpp', 'cost', 'modal'),
            valueAt(product, 'marketplace', 'platform'),
            valueAt(product, 'categoryGroup'),
            valueAt(product, 'categoryName', 'category'),
            stringifyPayload(product),
            valueAt(product, 'createdAt'),
            valueAt(product, 'updatedAt')
        ])
    ];
}

export function historyToRows(history = []) {
    return [
        HISTORY_HEADERS,
        ...history.map(item => [
            valueAt(item, 'id'),
            valueAt(item, 'productName', 'name'),
            valueAt(item, 'marketplace', 'platform'),
            valueAt(item, 'sellingPrice', 'price'),
            valueAt(item, 'hpp', 'cost', 'modal'),
            valueAt(item, 'profit', 'netProfit'),
            valueAt(item, 'margin'),
            stringifyPayload(item),
            valueAt(item, 'createdAt', 'date', 'timestamp')
        ])
    ];
}

export function scenariosToRows(scenarios = []) {
    return [
        SCENARIO_HEADERS,
        ...scenarios.map(scenario => [
            valueAt(scenario, 'id'),
            valueAt(scenario, 'label'),
            valueAt(scenario, 'name', 'productName'),
            stringifyPayload(scenario),
            valueAt(scenario, 'createdAt'),
            valueAt(scenario, 'updatedAt')
        ])
    ];
}

export function settingsToRows(settings = {}) {
    const entries = Array.isArray(settings)
        ? settings
        : Object.entries(settings).map(([key, value]) => ({ key, value }));

    return [
        SETTINGS_HEADERS,
        ...entries.map(item => [
            valueAt(item, 'key'),
            typeof item.value === 'string' ? item.value : stringifyPayload(item.value),
            valueAt(item, 'updatedAt') || new Date().toISOString()
        ])
    ];
}

export function syncLogRows(event, detail = '') {
    return [
        SYNC_LOG_HEADERS,
        [event, detail, new Date().toISOString()]
    ];
}

function rowsToObjects(rows = [], headers = []) {
    const [, ...body] = rows;
    return body
        .filter(row => row?.some(cell => String(cell || '').trim() !== ''))
        .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

export function rowsToProducts(rows = []) {
    return rowsToObjects(rows, PRODUCT_HEADERS).map(row => parsePayloadJson(row.payloadJson) || row);
}

export function rowsToHistory(rows = []) {
    return rowsToObjects(rows, HISTORY_HEADERS).map(row => parsePayloadJson(row.payloadJson) || row);
}

export function rowsToScenarios(rows = []) {
    return rowsToObjects(rows, SCENARIO_HEADERS).map(row => parsePayloadJson(row.payloadJson) || row);
}

export function rowsToSettings(rows = []) {
    return Object.fromEntries(
        rowsToObjects(rows, SETTINGS_HEADERS).map(row => {
            const parsed = parsePayloadJson(row.value);
            return [row.key, parsed ?? row.value];
        }).filter(([key]) => key)
    );
}
