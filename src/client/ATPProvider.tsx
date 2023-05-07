import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { BskyAgent } from "@atproto/api";
import * as jwt from "jsonwebtoken";

import { useLocalStorageState } from "./useLocalStorageState";
import type { AccessJwt, LoginResponseData } from "../types";

type ATPContextType = {
  agent: BskyAgent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: (args: { ignoreCache?: boolean }) => Promise<string | null>;
};

export const ATPContext = createContext<ATPContextType>({
  agent: null,
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

export const ATPProvider = ({
  agent,
  children,
}: {
  agent: BskyAgent;
  children: ReactNode;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [loginResponseData, setLoginResponseData] =
    useLocalStorageState<LoginResponseData | null>("@loginResponseData", null);

  const accessJwt = loginResponseData?.accessJwt
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
        agent.com.atproto.server.refreshSession();
      }, Math.max(timeUntilLoginExpire, 0));

      return () => clearTimeout(timeout);
    }
  }, [timeUntilLoginExpire, setLoginResponseData]);

  useEffect(() => {
    if (loginResponseData && !agent.session) {
      agent.resumeSession(loginResponseData);
    }
  }, [loginResponseData]);

  const login = useCallback(
    async (username: string, password: string) => {
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
    },
    [agent]
  );

  const logout = async () => {
    setLoginResponseData(null);
    // setIsAuthenticated(false);
  };

  const getToken = useCallback(
    async ({ ignoreCache = false }) => {
      if (ignoreCache) {
        try {
          const response = await agent.com.atproto.server.refreshSession();

          if (response.success) {
            setLoginResponseData({ ...response.data });

            return response.data.accessJwt;
          }
        } catch (err) {
          console.error(err);
        }
      }
      return loginResponseData?.accessJwt || null;
    },
    [agent]
  );

  return (
    <ATPContext.Provider
      value={{
        agent,
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
