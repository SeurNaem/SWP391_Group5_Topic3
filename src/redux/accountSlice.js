import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        login: (state, action) => {
            return action.payload;
        },
        logout: () => {
            return initialState;
        },
    },
});

// Action creators are generated for each case reducer function
export const { login, logout } = accountSlice.actions;

export default accountSlice.reducer;
