import { useEffect, useState } from "react";
import type { ServerConfig } from "../types/electron";

export const useConfig = () => {
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const cfg = await window.config.get();
        if (!active || !cfg) return;
        setIp(cfg.ip ?? "");
        setPort(cfg.port ?? "");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, []);

  const saveConfig = async (cfg: ServerConfig) => {
    setSaving(true);
    try {
      await window.config.set(cfg);
    } finally {
      setSaving(false);
    }
  };

  return {
    ip,
    port,
    setIp,
    setPort,
    loading,
    saving,
    saveConfig,
  };
};
