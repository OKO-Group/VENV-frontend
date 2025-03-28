import axios from 'axios';
import Cookies from 'js-cookie'
import {useAuthStore} from "@/stores/auth.ts";
import type { User } from '@/types/oko.ts'

const api = axios.create({
  baseURL: 'https://api.oko.com/api/',
  withCredentials: true, // Required for session-based authentication
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN',
  withXSRFToken: true,
});

export default api;
