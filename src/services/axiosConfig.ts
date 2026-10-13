import axios from 'axios';
import { message } from 'antd';

export const apiPublic = axios.create();

export const apiPrivate = axios.create();

apiPrivate.interceptors.request.use((config) => {
  const token = localStorage.getItem('sisc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message ?? '';
      const isExpired = msg.toLowerCase().includes('expirado') || msg.toLowerCase().includes('expired');

      localStorage.removeItem('sisc_token');
      localStorage.removeItem('sisc_user');

      // Exibe a mensagem antes de redirecionar
      message.error(
        isExpired
          ? 'Sua sessão expirou. Faça login novamente.'
          : 'Sessão inválida. Faça login novamente.',
        3, // duração em segundos
      );

      // Aguarda 1s para o usuário ler antes de redirecionar
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }

    if (error.response?.status === 403) {
      message.error('Acesso não autorizado.');
    }

    return Promise.reject(error);
  }
);