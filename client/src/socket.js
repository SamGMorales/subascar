import { io } from 'socket.io-client';
import { getToken } from './api';

// el token se lee cada vez que se conecta, asi al hacer login solo se reconecta
export const socket = io({
  auth: cb => cb({ token: getToken() })
});

export function reconectarSocket() {
  socket.disconnect();
  socket.connect();
}
