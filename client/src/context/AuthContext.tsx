import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Business } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  business: Business | null;
  partners: any[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerBusiness: (formData: any) => Promise<any>;
  logout: () => void;
  switchDemoPartner: (target: string | number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('partnerledger_token'));
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('partnerledger_token');
    if (!currentToken) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPartners(data.partners || []);
        if (data.user?.business_id) {
          setBusiness({
            id: data.user.business_id,
            name: data.user.business_name || 'Business Workspace',
            type: data.user.business_type || 'Partnership',
            category: 'Creative Services',
            email: data.user.email,
            phone: data.user.phone || '',
            currency: data.user.currency || 'INR',
            currency_symbol: data.user.currency_symbol || '₹',
            address: '',
            gstin: data.user.gstin
          });
        }
      } else {
        localStorage.removeItem('partnerledger_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }

    localStorage.setItem('partnerledger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshProfile();
  };

  const registerBusiness = async (formData: any) => {
    const res = await fetch('/api/auth/register-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.token) {
      localStorage.setItem('partnerledger_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
    }
    return data;
  };

  const switchDemoPartner = async (target: string | number) => {
    const partner = typeof target === 'number' ? target : (String(target).includes('alex') || target === '2' ? 2 : 1);
    const res = await fetch('/api/auth/demo-switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ partner })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('partnerledger_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await refreshProfile();
      window.location.reload();
    }
  };

  const logout = () => {
    localStorage.removeItem('partnerledger_token');
    setToken(null);
    setUser(null);
    setBusiness(null);
    setPartners([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        business,
        partners,
        isLoading,
        login,
        registerBusiness,
        logout,
        switchDemoPartner,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
