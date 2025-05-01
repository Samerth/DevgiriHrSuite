export const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? import.meta.env.VITE_PRODUCTION_BASE_URL || 'http://codsphere.in:5000'
    : import.meta.env.VITE_BASE_URL || 'http://localhost:5000'
}; 