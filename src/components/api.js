import axios from 'axios';

const api = axios.create({
  //baseURL: 'http://localhost:5000/api',
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 

