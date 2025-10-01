import { configureStore } from "@reduxjs/toolkit";
import accountReducer from "./accountSlice";
import categoryReducer from "./slices/categorySlice";
import stationReducer from "./slices/stationSlice";

export const store = configureStore({
    reducer: {
        account: accountReducer,
        categories: categoryReducer,
        stations: stationReducer,
    },
});
