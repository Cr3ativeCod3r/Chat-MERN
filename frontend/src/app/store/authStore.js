import { makeAutoObservable, runInAction, configure } from 'mobx';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND;

configure({
  enforceActions: 'never',
});

export class AuthStore {
  user = null;
  loading = false;
  error = null;
  isAuthenticated = false;

  constructor() {
    makeAutoObservable(this);
    if (typeof window !== 'undefined') {
      this.checkAuth();
    }
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return Cookies.get('authToken');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      if (token) {
        Cookies.set('authToken', token, { expires: 30 });
      } else {
        Cookies.remove('authToken');
      }
    }
  }

  async checkAuth() {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticated = false;
      this.user = null;
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      this.loading = true;
      const response = await axios.get(`${API_BASE}/api/auth/profile`, config);
      
      runInAction(() => {
        this.user = response.data;
        this.isAuthenticated = true;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;
        this.setToken(null);
      });
    }
  }

  async login(email, password) {
    try {
      this.loading = true;
      this.error = null;
      
      const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      
      runInAction(() => {
        this.user = response.data;
        this.isAuthenticated = true;
        this.setToken(response.data.token);
        this.loading = false;
      });
      
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Błąd podczas logowania';
        this.loading = false;
      });
      
      return false;
    }
  }

  async register(email, password, nick) {
    try {
      this.loading = true;
      this.error = null;
      
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        email,
        password,
        nick,
      });
      
      runInAction(() => {
        this.user = response.data;
        this.isAuthenticated = true;
        this.setToken(response.data.token);
        this.loading = false;
      });
      
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Błąd podczas rejestracji';
        this.loading = false;
      });
      
      return false;
    }
  }

  logout() {
    this.user = null;
    this.isAuthenticated = false;
    this.setToken(null);
  }
}

export const authStore = new AuthStore();


