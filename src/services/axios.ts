import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://api-responze.nivos.tech/api'
});


export default instance;
