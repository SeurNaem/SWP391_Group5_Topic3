import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

// Async thunks for API calls
export const fetchStations = createAsyncThunk(
    'stations/fetchStations',
    async (_, { rejectWithValue }) => {
        try {
            // Use new backend endpoint for charging stations
            const response = await api.get('ChargingStation');

            console.log('Raw API Response:', response.data);

            // Map backend response to frontend format
            const mappedStations = response.data.map(station => {
                console.log('Processing station:', station);
                return {
                    id: station.stationId,
                    title: station.name,
                    lat: station.latitude,
                    lng: station.longitude,
                    address: station.address,
                    status: mapStatus(station.status),
                    type: 'charging-station',
                    description: `Rating: ${station.rating}/5`,
                    // Extract unique connector types from charging points
                    chargerTypes: station.chargingPoints?.length > 0 ?
                        [...new Set(station.chargingPoints.map(point =>
                            point.connectorType || point.type || 'Type 2'
                        ))] :
                        ['Type 2', 'CCS'], // Default types if no charging points data
                    power: station.totalPoints ? `${station.totalPoints * 22}kW` :
                        station.chargingPoints?.length > 0 ? `${station.chargingPoints.length * 22}kW` : '22kW',
                    price: station.pricePerKWh ? `${station.pricePerKWh} VND/kWh` : '3,500 VND/kWh',
                    imageUrl: station.imageUrl,
                    rating: station.rating,
                    openHours: station.openHours,
                    chargingPoints: station.chargingPoints || []
                };
            });

            console.log('Mapped stations:', mappedStations);
            return mappedStations;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Helper function to map backend status to frontend status
const mapStatus = (backendStatus) => {
    const statusMap = {
        'online': 'Available',
        'offline': 'Maintenance',
        'busy': 'Occupied'
    };
    return statusMap[backendStatus] || 'Available';
};

export const createStation = createAsyncThunk(
    'stations/createStation',
    async (stationData, { rejectWithValue }) => {
        try {
            // Map frontend data to backend format
            const backendData = {
                name: stationData.title || stationData.name,
                latitude: stationData.lat || stationData.latitude,
                longitude: stationData.lng || stationData.longitude,
                address: stationData.address,
                status: stationData.status === 'Available' ? 'online' : 'offline',
                rating: stationData.rating || 0,
                imageUrl: stationData.imageUrl
            };

            const response = await api.post('ChargingStation', backendData);

            // Map response back to frontend format
            const station = response.data;
            return {
                id: station.stationId,
                title: station.name,
                lat: station.latitude,
                lng: station.longitude,
                address: station.address,
                status: mapStatus(station.status),
                type: 'charging-station',
                description: `Rating: ${station.rating}/5`,
                chargerTypes: ['Type 2', 'CCS'],
                power: '22kW',
                price: '3,500 VND/kWh',
                imageUrl: station.imageUrl,
                rating: station.rating,
                openHours: station.openHours,
                chargingPoints: station.chargingPoints || []
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateStation = createAsyncThunk(
    'stations/updateStation',
    async ({ id, ...stationData }, { rejectWithValue }) => {
        try {
            // Map frontend data to backend format
            const backendData = {
                name: stationData.title || stationData.name,
                latitude: stationData.lat || stationData.latitude,
                longitude: stationData.lng || stationData.longitude,
                address: stationData.address,
                status: stationData.status === 'Available' ? 'online' : 'offline',
                rating: stationData.rating || 0,
                imageUrl: stationData.imageUrl
            };

            const response = await api.put(`ChargingStation/${id}`, backendData);

            // Map response back to frontend format
            const station = response.data;
            return {
                id: station.stationId,
                title: station.name,
                lat: station.latitude,
                lng: station.longitude,
                address: station.address,
                status: mapStatus(station.status),
                type: 'charging-station',
                description: `Rating: ${station.rating}/5`,
                chargerTypes: ['Type 2', 'CCS'],
                power: '22kW',
                price: '3,500 VND/kWh',
                imageUrl: station.imageUrl,
                rating: station.rating,
                openHours: station.openHours,
                chargingPoints: station.chargingPoints || []
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteStation = createAsyncThunk(
    'stations/deleteStation',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`ChargingStation/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    stations: [],
    loading: false,
    error: null,
    selectedStation: null,
};

const stationSlice = createSlice({
    name: 'stations',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSelectedStation: (state, action) => {
            state.selectedStation = action.payload;
        },
        clearSelectedStation: (state) => {
            state.selectedStation = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch stations
            .addCase(fetchStations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStations.fulfilled, (state, action) => {
                state.loading = false;
                state.stations = action.payload;
            })
            .addCase(fetchStations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create station
            .addCase(createStation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createStation.fulfilled, (state, action) => {
                state.loading = false;
                state.stations.push(action.payload);
            })
            .addCase(createStation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update station
            .addCase(updateStation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateStation.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.stations.findIndex(station => station.id === action.payload.id);
                if (index !== -1) {
                    state.stations[index] = action.payload;
                }
            })
            .addCase(updateStation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete station
            .addCase(deleteStation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteStation.fulfilled, (state, action) => {
                state.loading = false;
                state.stations = state.stations.filter(station => station.id !== action.payload);
            })
            .addCase(deleteStation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, setSelectedStation, clearSelectedStation } = stationSlice.actions;
export default stationSlice.reducer;
