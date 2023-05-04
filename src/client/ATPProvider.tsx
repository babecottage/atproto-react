import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BskyAgent } from "@atproto/api";
import * as jwt from "jsonwebtoken";

import { useLocalStorageState } from "./useLocalStorageState";
import type { AccessJwt, LoginResponseData } from "../types";

const agent = new BskyAgent({
  service: "https://bsky.social",
});

type ATPContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

export const ATPContext = createContext<ATPContextType>({
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  getToken: async () => null,
});

/**
 * refactored to a Provider from Skyline code
 * tysm @louislva
 * https://github.com/louislva/skyline/
 */

export const ATPProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [loginResponseData, setLoginResponseData] =
    useLocalStorageState<LoginResponseData | null>("@loginResponseData", null);

  const accessJwt = !!loginResponseData?.accessJwt
    ? (jwt.decode(loginResponseData.accessJwt) as AccessJwt)
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

      console.log(response);

      if (response.success) {
        setLoginResponseData({ ...response.data });
        // setIsAuthenticated(true);
      } else {
        setLoginResponseData(null);
        throw new Error("could not login");
        // setIsAuthenticated(false);
      }
    } catch (err) {
      setLoginResponseData(null);
      throw new Error("could not login");
      // setIsAuthenticated(false);
    }

    setIsLoading(false);

    return;
  };

  const logout = async () => {
    setLoginResponseData(null);
    // setIsAuthenticated(false);
  };

  const getToken = async () => {
    console.log("getToken");
    return "";
  };

  return (
    <ATPContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </ATPContext.Provider>
  );
};

export const useATP = (): ATPContextType => {
  const context = useContext(ATPContext);

  if (!context) {
    throw new Error("useATP must be used within a ATPProvider");
  }

  return context;
};
