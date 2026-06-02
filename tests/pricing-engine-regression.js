#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

const context = {
    console,
    window: {},
    AppState: {
        get() {
            return undefined;
        }
    },
    Formatters: {
        parseNumber(value) {
            if (typeof value === 'number') return value;
            return parseFloat(String(value || '').replace(/[^\d.-]/g, '')) || 0;
        },
        formatRupiah(value) {
            return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
        }
    }
};
context.global = context;
vm.createContext(context);

function loadScript(relativePath) {
    const filePath = path.join(rootDir, relativePath);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
}

loadScript('js/constants.js');
loadScript('js/data.js');
loadScript('js/data-tokopedia.js');
loadScript('js/data-tiktok.js');
loadScript('js/core/pricing-engine.js');

const PricingEngine = context.PricingEngine || context.window.PricingEngine;

function getPlatformRates(platform, sellerType) {
    const shopeeRates = context.shopeeRates || context.window.shopeeRates;
    const tokopediaRates = context.tokopediaRates || context.window.tokopediaRates;
    const tiktokRates = context.tiktokRates || context.window.tiktokRates;

    if (platform === 'tokopedia') {
        return tokopediaRates?.[sellerType] || tokopediaRates?.regular || shopeeRates.nonstar;
    }
    if (platform === 'tiktok') {
        return tiktokRates?.[sellerType] || tiktokRates?.regular || shopeeRates.nonstar;
    }
    return shopeeRates[sellerType] || shopeeRates.nonstar;
}

function legacyCalculate(params) {
    const sellerType = params.sellerType || 'nonstar';
    const isFreeShip = Boolean(params.isFreeShip);
    const isCashback = Boolean(params.isCashback);
    const affiliatePercent = Math.max(0, Number(params.affiliatePercent) || 0);
    const maxServiceFee = Math.max(0, Number(params.maxServiceFee) || 0);
    const orderProcessFee = Math.max(0, Number(params.orderProcessFee) || 0);
    const fixedFee = Math.max(0, Number(params.fixedFee) || 0);
    const operationalCost = Math.max(0, Number(params.operationalCost) || 0);
    const adsCost = Math.max(0, Number(params.adsCost) || 0);
    const sellingPrice = Number(params.sellingPrice) || 0;
    const discountPercent = Number(params.discountPercent) || 0;
    const voucherAmount = Number(params.voucherAmount) || 0;
    const hpp = Number(params.hpp) || 0;
    const categoryGroup = params.categoryGroup || 'A';

    const displayPrice = sellingPrice - (sellingPrice * discountPercent / 100);
    const basis = Math.max(0, displayPrice - voucherAmount);
    const platformRates = getPlatformRates(params.platform || 'shopee', sellerType);
    const adminRate = platformRates && platformRates[categoryGroup] !== undefined ? platformRates[categoryGroup] : 0;
    const adminFee = basis * (adminRate / 100);

    let freeShipFee = isFreeShip ? Math.min(basis * 0.04, 40000) : 0;
    if (maxServiceFee > 0 && freeShipFee > maxServiceFee) freeShipFee = maxServiceFee;
    const cashbackFee = isCashback ? Math.min(basis * 0.045, 60000) : 0;
    const serviceFee = freeShipFee + cashbackFee;
    const affiliateFee = basis * (affiliatePercent / 100);

    let customDeductions = 0;
    let customAdditions = 0;
    (params.customCosts || []).forEach(cost => {
        const amount = cost.isPercent ? basis * (cost.amount / 100) : cost.amount;
        if (cost.category === 'potongan') customDeductions += amount;
        else customAdditions += amount;
    });

    const marketplaceDeductions = adminFee + serviceFee + affiliateFee + fixedFee + orderProcessFee;
    const totalDeductions = marketplaceDeductions + customDeductions;
    const netIncome = basis - totalDeductions;
    const totalCost = hpp + operationalCost + adsCost + customAdditions;
    const netProfit = netIncome - totalCost;
    const margin = basis > 0 ? (netProfit / basis) * 100 : 0;

    return {
        displayPrice,
        basis,
        adminRate,
        adminFee,
        freeShipFee,
        cashbackFee,
        serviceFee,
        affiliateFee,
        marketplaceDeductions,
        totalDeductions,
        netIncome,
        totalCost,
        netProfit,
        margin
    };
}

const cases = [
    {
        name: 'Shopee nonstar A with voucher, free ship, cashback, affiliate, fixed fees',
        params: {
            platform: 'shopee', sellerType: 'nonstar', categoryGroup: 'A',
            sellingPrice: 100000, discountPercent: 10, voucherAmount: 5000, hpp: 45000,
            isFreeShip: true, isCashback: true, affiliatePercent: 2,
            orderProcessFee: 1250, fixedFee: 500, operationalCost: 2000, adsCost: 3000
        }
    },
    {
        name: 'Shopee mall C with free ship maxServiceFee override',
        params: {
            platform: 'shopee', sellerType: 'mall', categoryGroup: 'C',
            sellingPrice: 2000000, discountPercent: 0, voucherAmount: 0, hpp: 1200000,
            isFreeShip: true, isCashback: false, affiliatePercent: 0,
            maxServiceFee: 25000, orderProcessFee: 1250, fixedFee: 0, operationalCost: 10000, adsCost: 0
        }
    },
    {
        name: 'Tokopedia regular B with custom deduction and modal cost',
        params: {
            platform: 'tokopedia', sellerType: 'regular', categoryGroup: 'B',
            sellingPrice: 350000, discountPercent: 5, voucherAmount: 10000, hpp: 220000,
            isFreeShip: false, isCashback: false, affiliatePercent: 1.5,
            orderProcessFee: 1250, fixedFee: 1000, operationalCost: 5000, adsCost: 15000,
            customCosts: [
                { amount: 2, isPercent: true, category: 'potongan' },
                { amount: 7500, isPercent: false, category: 'modal' }
            ]
        }
    },
    {
        name: 'TikTok mall D with capped cashback',
        params: {
            platform: 'tiktok', sellerType: 'mall', categoryGroup: 'D',
            sellingPrice: 3000000, discountPercent: 0, voucherAmount: 0, hpp: 1800000,
            isFreeShip: false, isCashback: true, affiliatePercent: 0,
            orderProcessFee: 1250, fixedFee: 0, operationalCost: 25000, adsCost: 50000
        }
    },
    {
        name: 'Shopee star F with deduction alias',
        params: {
            platform: 'shopee', sellerType: 'star', categoryGroup: 'F',
            sellingPrice: 150000, discountPercent: 0, voucherAmount: 15000, hpp: 90000,
            isFreeShip: false, isCashback: false, affiliatePercent: 3,
            orderProcessFee: 1250, fixedFee: 0, operationalCost: 4000, adsCost: 0,
            customCosts: [
                { amount: 1000, isPercent: false, category: 'potongan' },
                { amount: 2500, isPercent: false, category: 'modal' }
            ]
        }
    }
];

const fields = [
    'displayPrice', 'basis', 'adminRate', 'adminFee', 'freeShipFee', 'cashbackFee',
    'serviceFee', 'affiliateFee', 'marketplaceDeductions', 'totalDeductions',
    'netIncome', 'totalCost', 'netProfit', 'margin'
];

function approxEqual(a, b) {
    return Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.000001;
}

let failures = 0;

cases.forEach(testCase => {
    const expected = legacyCalculate(testCase.params);
    const actual = PricingEngine.calculateFees(testCase.params);

    fields.forEach(field => {
        if (!approxEqual(actual[field], expected[field])) {
            failures += 1;
            console.error(`FAIL: ${testCase.name}`);
            console.error(`  ${field}: expected ${expected[field]}, got ${actual[field]}`);
        }
    });
});

if (failures > 0) {
    console.error(`\n${failures} pricing regression assertion(s) failed.`);
    process.exit(1);
}

console.log(`OK: ${cases.length} pricing regression cases passed.`);
