import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.oko.com/api/',
  withCredentials: true, // Required for session-based authentication
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN',
  withXSRFToken: true,
})

export default api
