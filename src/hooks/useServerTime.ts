import { useEffect, useState } from "react";
import timeService from "../services/timeService";

type SyncStatus = "loading" | "error" | "success";

export const useServerTime = () => {
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let active = true;

    const syncWithServer = async () => {
      try {
        const serverTime = await timeService.getTime();
        if (!active) return;
        setOffset(serverTime - Date.now());
        setStatus("success");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };

    void syncWithServer();
    const syncInterval = setInterval(() => {
      void syncWithServer();
    }, 60000);

    return () => {
      active = false;
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    if (status !== "success") return;

    const tick = setInterval(() => {
      setTime(new Date(Date.now() + offset));
    }, 1000);

    return () => {
      clearInterval(tick);
    };
  }, [offset, status]);

  const retry = async () => {
    setStatus("loading");
    try {
      const serverTime = await timeService.getTime();
      setOffset(serverTime - Date.now());
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return { status, time, retry };
};
