import { useEffect, useState } from "react";
import employeeService from "../services/employeeService";
import type { User } from "../types/userType";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await employeeService.getEmployees();
      setEmployees(list);
    } catch {
      setError("Nao foi possivel carregar os funcionarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  return { employees, loading, error, reload: loadEmployees };
};
