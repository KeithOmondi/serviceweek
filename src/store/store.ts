import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import mattersReducer from "./slices/matterSlice"
import courtsReducer from "./slices/courtSlice"
import { injectStore } from '../api/api'; // Import the injection helper

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matters: mattersReducer,
    courts: courtsReducer
  },
});

// Inject the store instance into the API file to break the circular dependency
injectStore(store);

export type AppStore = typeof store; // Export the Store type
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;