export const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? import.meta.env.VITE_PRODUCTION_BASE_URL
    : import.meta.env.VITE_BASE_URL
}; 