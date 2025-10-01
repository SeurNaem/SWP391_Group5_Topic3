import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
export const fetchStations = createAsyncThunk(
    'stations/fetchStations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('https://68d390e7214be68f8c6646ef.mockapi.io/station');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createStation = createAsyncThunk(
    'stations/createStation',
    async (stationData, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                'https://68d390e7214be68f8c6646ef.mockapi.io/station',
                stationData
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateStation = createAsyncThunk(
    'stations/updateStation',
    async ({ id, ...stationData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(
                `https://68d390e7214be68f8c6646ef.mockapi.io/station/${id}`,
                stationData
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteStation = createAsyncThunk(
    'stations/deleteStation',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`https://68d390e7214be68f8c6646ef.mockapi.io/station/${id}`);
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
