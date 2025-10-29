import { combineReducers } from "@reduxjs/toolkit";
import accountReducer from "./accountSlice";
import stationReducer from "./slices/stationSlice";

const rootReducer = combineReducers({
  account: accountReducer,
  stations: stationReducer,
});

export default rootReducer;
