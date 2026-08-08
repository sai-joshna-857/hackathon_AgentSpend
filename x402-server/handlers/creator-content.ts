export const handleCreatorContentRequest = () => {
  return {
    status: 200,
    data: {
      contentTitle: 'Exclusive Algorand Smart Contract Architecture Masterclass',
      mediaType: 'Video Stream HLS 4K',
      accessPassGranted: true,
      unlockDurationSeconds: 86400,
      timestamp: new Date().toISOString(),
    },
  };
};
