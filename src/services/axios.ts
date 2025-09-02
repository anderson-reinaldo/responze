import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5163/api'
});


export default instance;
