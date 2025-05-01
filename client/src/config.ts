export const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'http://codsphere.in:5000'
    : import.meta.env.VITE_BASE_URL || 'http://localhost:5000'
}; 