export const handleWeatherRequest = () => {
  return {
    status: 200,
    data: {
      location: 'Algorand Global Node Mesh',
      temperature: '24.5°C',
      humidity: '48%',
      windSpeed: '12 km/h',
      satelliteTelemetry: 'Clear skies over consensus validators',
      timestamp: new Date().toISOString(),
    },
  };
};
