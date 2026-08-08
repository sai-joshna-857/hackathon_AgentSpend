export const handleAnalyticsRequest = () => {
  return {
    status: 200,
    data: {
      marketDepth: '$14,250,000 USDCa',
      topDexPools: ['Tinyman ALGO/USDCa', 'Pact ALGO/gALGO'],
      arbitrageOpportunitiesCount: 4,
      networkTps: '6,000 TPS Capacity',
      timestamp: new Date().toISOString(),
    },
  };
};
