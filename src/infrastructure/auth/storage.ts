import * as SecureStore from 'expo-secure-store';

const KEY = 'estetica.client.session';
const REFRESH_KEY = 'estetica.client.refresh';
export const readToken = () => SecureStore.getItemAsync(KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token);
export const removeToken = () => SecureStore.deleteItemAsync(KEY);
export const readRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const saveRefreshToken = (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token);
export const removeRefreshToken = () => SecureStore.deleteItemAsync(REFRESH_KEY);
