export const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://codsphere.in'
    : import.meta.env.VITE_BASE_URL || 'http://localhost:5000'
}; 