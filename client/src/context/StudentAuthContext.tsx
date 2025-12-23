import { createContext, useContext, useEffect, useMemo, useState } from "react";

type StudentData = any;

type StudentAuthContextValue = {
  studentData: StudentData | null;
  setStudentData: (data: StudentData | null) => void;
  clearStudentData: () => void;
};

const StudentAuthContext = createContext<StudentAuthContextValue | undefined>(undefined);

const getStoredStudent = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem("studentData");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const StudentAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [studentData, setStudentDataState] = useState<StudentData | null>(() => getStoredStudent());

  const setStudentData = (data: StudentData | null) => {
    setStudentDataState(data);
  };

  const clearStudentData = () => {
    setStudentDataState(null);
  };

  useEffect(() => {
    if (studentData) {
      localStorage.setItem("studentData", JSON.stringify(studentData));
    } else {
      localStorage.removeItem("studentData");
    }
  }, [studentData]);

  const value = useMemo(
    () => ({
      studentData,
      setStudentData,
      clearStudentData,
    }),
    [studentData]
  );

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within StudentAuthProvider");
  }
  return context;
};
