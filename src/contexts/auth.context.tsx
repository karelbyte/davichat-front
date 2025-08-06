"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "react-toastify";
import { apiService, User } from '../services/api';

export interface AuthUser {
  id: string;
  username: string;
  code: string;
  names: string;
  email: string;
  rol_id: string;
  is_staff: boolean;
  is_active: boolean;
  logins: number;
  can_download_xlsx: boolean;
  roles: Array<{
    code: string;
    description: string;
  }>;
  token: string;
  boss_id?: string;
  created_at?: string;
  updated_at?: string;
  leader?: {
    names: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  connectToChat: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const getBaseDomain = () => {
  const hostname = process.env.NEXT_PUBLIC_DOMAIN_BASE || '.davihub.achdavivienda.org' 
  return hostname
}

const setCookie = (name: string, value: string, expires: number) => {
  if (typeof window === 'undefined') return;
  const date = new Date(expires * 1000);
  const domain = getBaseDomain();
  document.cookie = `${name}=${value}; path=/; domain=${domain}; expires=${date.toUTCString()}; SameSite=Strict`;
};

const getCookie = (name: string) => {
  if (typeof window === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  const domain = getBaseDomain();
  document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict`;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para mapear AuthUser a User del chat
  const connectToChat = async (): Promise<User | null> => {
    if (!user) {
      console.error("No hay usuario autenticado para conectar al chat");
      return null;
    }

    try {
      // Mapear AuthUser a User para el API del chat
      const chatUserData = {
        id: user.id,
        name: user.names, // AuthUser.names → User.name
        email: user.email,
        roles: user.roles.map(role => role.code), // AuthUser.roles[].code → User.roles[]
        filials: ["filial 1"], // Array fijo como solicitado
        status: 'online',
        lastSeen: new Date().toISOString(),
        isActive: true
      };

      // Llamar al API del chat para crear/actualizar usuario
      const chatUser = await apiService.createUser(chatUserData);
      
      return chatUser;
    } catch (error) {
      console.error("Error conectando al chat:", error);
      toast.error("Error al conectar con el chat");
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        
        const hubToken = getCookie('token');
        const hubUserData = getCookie('user');
        const hubExpiredAt = getCookie('expired_at');

        if (hubToken && hubExpiredAt && hubUserData) {
          const expirationTime = parseInt(hubExpiredAt);
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (currentTime >= expirationTime) {
           
            deleteCookie('token');
            deleteCookie('user');
            deleteCookie('expired_at');
          } else {
       
            try {
              const parsedHubUser = JSON.parse(hubUserData);
              
              
              const convertedUser: AuthUser = {
                id: parsedHubUser.id || '',
                username: parsedHubUser.username || parsedHubUser.email || '',
                code: parsedHubUser.code || '',
                names: parsedHubUser.names || parsedHubUser.name || '',
                email: parsedHubUser.email || '',
                rol_id: parsedHubUser.rol_id || parsedHubUser.role_id || '',
                is_staff: Boolean(parsedHubUser.is_staff),
                is_active: Boolean(parsedHubUser.is_active),
                logins: parsedHubUser.logins || 0,
                can_download_xlsx: Boolean(parsedHubUser.can_download_xlsx),
                roles: parsedHubUser.roles || [],
                token: hubToken,
                boss_id: parsedHubUser.boss_id || '',
                created_at: parsedHubUser.created_at || '',
                updated_at: parsedHubUser.updated_at || '',
                leader: parsedHubUser.leader || { names: '' },
              };
              
              setToken(hubToken);
              setUserState(convertedUser);
              
              
              localStorage.setItem(TOKEN_KEY, hubToken);
              localStorage.setItem(USER_KEY, JSON.stringify(convertedUser));
              localStorage.setItem("current_user", btoa(JSON.stringify(convertedUser)));
           
              
              setIsLoading(false);
              return;
            } catch (parseError) {
              console.error("Error parseando usuario del hub:", parseError);
        
            }
          }
        }
        

        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        
        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          

          if (parsedUser && 
              parsedUser.id && 
              parsedUser.names && 
              parsedUser.email && 
              Array.isArray(parsedUser.roles)) {
            

            const validatedUser: AuthUser = {
              id: parsedUser.id,
              username: parsedUser.username || parsedUser.email,
              code: parsedUser.code || "",
              names: parsedUser.names,
              email: parsedUser.email,
              rol_id: parsedUser.rol_id || "",
              is_staff: Boolean(parsedUser.is_staff),
              is_active: Boolean(parsedUser.is_active),
              logins: parsedUser.logins || 0,
              can_download_xlsx: Boolean(parsedUser.can_download_xlsx),
              roles: parsedUser.roles || [],
              token: parsedUser.token || savedToken,
              boss_id: parsedUser.boss_id || "",
              created_at: parsedUser.created_at || "",
              updated_at: parsedUser.updated_at || "",
              leader: parsedUser.leader || { names: "" },
            };
            
            setToken(savedToken);
            setUserState(validatedUser);
            

            const futureExpire = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 horas
            setCookie('token', savedToken, futureExpire);
            setCookie('user', JSON.stringify(validatedUser), futureExpire);
            setCookie('expired_at', futureExpire.toString(), futureExpire);
            
          } else {
            console.warn("Usuario guardado tiene estructura inválida, limpiando...");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem("current_user");
          }
        }
      } catch (error) {
        console.error("Error al cargar datos de autenticación:", error);

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("current_user");
        deleteCookie('token');
        deleteCookie('user');
        deleteCookie('expired_at');
      } finally {
        setIsLoading(false);
      }
    };
   
    checkAuth();
    
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  const setUser = (userData: AuthUser) => {
    setUserState(userData);
    setToken(userData.token);
    

    localStorage.setItem(TOKEN_KEY, userData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    localStorage.setItem("current_user", btoa(JSON.stringify(userData)));
    

    const futureExpire = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 horas
    setCookie('token', userData.token, futureExpire);
    setCookie('user', JSON.stringify(userData), futureExpire);
    setCookie('expired_at', futureExpire.toString(), futureExpire);
    
  };

  const logout = () => {

    setUserState(null);
    setToken(null);


    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("current_user");
    localStorage.removeItem("storeSubordinates");
    

    deleteCookie('token');
    deleteCookie('user');
    deleteCookie('expired_at');
    
    toast.info("Sesión cerrada correctamente");
    

    const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || 'https://davihub.achdavivienda.org';
    window.location.href = hubUrl;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    logout,
    setUser,
    connectToChat,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 