const axios = require('axios');

// Test the ChargingStation API to see what data is returned
const testChargingStationAPI = async () => {
    try {
        const response = await axios.get('https://ducthinh3108.azurewebsites.net/api/ChargingStation');

        console.log('=== ChargingStation API Response ===');
        console.log('Status:', response.status);
        console.log('Data length:', response.data.length);
        console.log('\n=== First Station Data Structure ===');
        if (response.data.length > 0) {
            console.log(JSON.stringify(response.data[0], null, 2));
        }

        console.log('\n=== All stations chargingPoints summary ===');
        response.data.forEach((station, index) => {
            console.log(`Station ${index + 1} (${station.name}): chargingPoints = ${station.chargingPoints ? station.chargingPoints.length : 'undefined'} items`);
            if (station.chargingPoints && station.chargingPoints.length > 0) {
                console.log('  First charging point:', JSON.stringify(station.chargingPoints[0], null, 4));
            }
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

testChargingStationAPI();
