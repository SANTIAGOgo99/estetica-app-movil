import * as SecureStore from 'expo-secure-store';

const KEY = 'estetica.client.session';
export const readToken = () => SecureStore.getItemAsync(KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token);
export const removeToken = () => SecureStore.deleteItemAsync(KEY);
