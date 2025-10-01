import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('https://68d390e7214be68f8c6646ef.mockapi.io/category');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/createCategory',
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                'https://68ce92096dc3f350777f6302.mockapi.io/Category',
                categoryData
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/updateCategory',
    async ({ id, ...categoryData }, { rejectWithValue }) => {
        try {
            const response = await axios.put(
                `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`,
                categoryData
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/deleteCategory',
    async (id, { rejectWithValue }) => {
        try {
            await axios.delete(`https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    categories: [],
    loading: false,
    error: null,
    selectedCategory: null,
};

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
        },
        clearSelectedCategory: (state) => {
            state.selectedCategory = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch categories
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create category
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories.push(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update category
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.categories.findIndex(cat => cat.id === action.payload.id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete category
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = state.categories.filter(cat => cat.id !== action.payload);
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, setSelectedCategory, clearSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;
