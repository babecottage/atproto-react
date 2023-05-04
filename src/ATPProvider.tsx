"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BskyAgent } from "@atproto/api";
import * as jwt from "jsonwebtoken";

import { useLocalStorageState } from "./hooks/useLocalStorageState";
import type { LoginResponseDataType } from "./types";

type RefreshJwtType = {
  exp: number;
  iat: number;
  jti: string; // long random key
  scope: "com.atproto.refresh";
  sub: string; // did
};

type AccessJwtType = {
  exp: number;
  iat: number;
  scope: string;
  sub: string;
};

const agent = new BskyAgent({
  service: "https://bsky.social",
});

type ATPContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
};

export const ATPContext = createContext<ATPContextType>({
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  getToken: () => null,
});

/**
 * refactored to a Provider from Skyline code
 * tysm @louislva
 * https://github.com/louislva/skyline/
 */

export const ATPProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [loginResponseData, setLoginResponseData] =
    useLocalStorageState<LoginResponseDataType | null>(
      "@loginResopnseData",
      null
    );

  const accessJwt = !!loginResponseData?.accessJwt
    ? (jwt.decode(loginResponseData.accessJwt) as AccessJwtType)
    : null;

  const loginExpiration = accessJwt?.exp;
  const timeUntilLoginExpire = loginExpiration
    ? loginExpiration * 1000 - Date.now()
    : null;

  const isAuthenticated = useMemo(() => {
    return !!loginResponseData;
  }, [loginResponseData]);

  useEffect(() => {
    if (timeUntilLoginExpire) {
      const timeout = setTimeout(() => {
        setLoginResponseData(null);
      }, Math.max(timeUntilLoginExpire, 0));

      return () => clearTimeout(timeout);
    }
  }, [timeUntilLoginExpire, setLoginResponseData]);

  useEffect(() => {
    if (loginResponseData && !agent.session) {
      agent.resumeSession(loginResponseData);
    }
  }, [loginResponseData]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await agent.login({
        identifier: username,
        password,
      });

      if (response.success) {
        setLoginResponseData({ ...response.data });
        // setIsAuthenticated(true);
      } else {
        setLoginResponseData(null);
        // setIsAuthenticated(false);
      }
    } catch (err) {
      setLoginResponseData(null);
      // setIsAuthenticated(false);
    }

    setIsLoading(false);
  };

  const logout = async () => {
    setLoginResponseData(null);
    // setIsAuthenticated(false);
  };

  const value: ATPContextType = {
    isLoading,
    isAuthenticated,
    login,
    logout,
    getToken: () => null,
  };

  return <ATPContext.Provider value={value}>{children}</ATPContext.Provider>;
};

export const useATP = () => {
  const { isAuthenticated, login, logout } = useContext(ATPContext);

  return {
    isAuthenticated,
    login,
    logout,
  };
};
