import { useCallback, useEffect, useMemo, useState } from "react";
import axios, { type AxiosRequestConfig } from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAdminAuth } from "@/context/AdminAuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050";
const ADMIN_BASE = `${API_BASE}/api/admin`;

type Department = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type Student = {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  department: Department | null;
  motherName: string;
  phone: string;
  studySemestersCount: number;
};

type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  units: number;
  curriculumSemester: number;
  departments: Department[];
};

type SubjectInput = {
  name: string;
  code: string;
  units: number;
  curriculumSemester: number;
  departmentIds: string[];
};

type Period = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
};

type RegistrationRow = {
  id: string;
  studentId: string;
  termId: string;
  student: {
    registrationId: string;
    fullName: string;
    email: string;
  };
};

type TimetableEntry = {
  id: string;
  termId: string;
  dayOfWeek: string;
  periodId: string;
  subjectId: string;
  roomText: string | null;
  lecturerText: string | null;
  period?: {
    label: string;
    startTime: string;
    endTime: string;
  };
  subject?: {
    code: string;
    name: string;
  };
};

type AdminRequest = <T = any>(config: AxiosRequestConfig) => Promise<T>;

const DAY_OPTIONS = [
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
];

const AdminDashboard = () => {
  const { authHeader } = useAdminAuth();
  const queryClient = useQueryClient();

  const getErrorMessage = (err: any, fallback: string) => {
    const apiMsg = err?.response?.data?.error;
    const details = err?.response?.data?.details;
    const fieldErrors = details?.fieldErrors
      ? Object.values(details.fieldErrors)
          .flat()
          .filter(Boolean)
      : [];
    const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
    const combined = [...fieldErrors, ...formErrors].filter(Boolean);
    if (combined.length) {
      return `${apiMsg || fallback}: ${combined.join(', ')}`;
    }
    return apiMsg || err?.message || fallback;
  };

  const adminRequest: AdminRequest = useCallback(
    async (config) => {
      if (!authHeader) throw new Error("Not authenticated");
      const response = await axios({
        baseURL: ADMIN_BASE,
        ...config,
        headers: {
          ...(config.headers || {}),
          Authorization: authHeader,
        },
      });
      return response.data;
    },
    [authHeader]
  );

  const [activeTab, setActiveTab] = useState("students");
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");
  const [subjectDeptFilter, setSubjectDeptFilter] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [showArchivedTerms, setShowArchivedTerms] = useState(false);
  const [bulkSubjects, setBulkSubjects] = useState("");
  const [bulkDepartmentIds, setBulkDepartmentIds] = useState<Set<string>>(new Set());
  const [timetableEditingId, setTimetableEditingId] = useState<string | null>(null);

  const [studentForm, setStudentForm] = useState({
    registrationId: "",
    fullName: "",
    email: "",
    departmentId: "",
    motherName: "",
    phone: "",
    password: "",
  });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [termForm, setTermForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
  });
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    units: "",
    curriculumSemester: "",
    departmentIds: [] as string[],
  });
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    isActive: true,
  });
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedOfferedSubjects, setSelectedOfferedSubjects] = useState<Set<string>>(new Set());

  const [registrationSelected, setRegistrationSelected] = useState<Set<string>>(new Set());
  const [registeredSelected, setRegisteredSelected] = useState<Set<string>>(new Set());

  const [studentSubjectAssign, setStudentSubjectAssign] = useState<Set<string>>(new Set());
  const [studentSubjectRemove, setStudentSubjectRemove] = useState<Set<string>>(new Set());
  const [gradeEdits, setGradeEdits] = useState<Record<string, string>>({});
  const [gradeStudentSearch, setGradeStudentSearch] = useState("");

  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: DAY_OPTIONS[0].value,
    periodId: "",
    subjectId: "",
    roomText: "",
    lecturerText: "",
  });

  const { data: terms = [] } = useQuery<Term[]>({
    queryKey: ["admin", "terms", showArchivedTerms],
    queryFn: () =>
      adminRequest({
        url: "/terms",
        params: { includeArchived: showArchivedTerms ? "true" : "false" },
      }),
  });

  useEffect(() => {
    if (!selectedTermId && terms.length) {
      const active = terms.find((t) => t.isActive);
      setSelectedTermId((active || terms[0]).id);
    }
  }, [terms, selectedTermId]);

  useEffect(() => {
    setRegistrationSelected(new Set());
    setRegisteredSelected(new Set());
    setSelectedStudentId(null);
    setStudentSubjectAssign(new Set());
    setStudentSubjectRemove(new Set());
    setGradeEdits({});
  }, [selectedTermId]);

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["admin", "departments", departmentSearch],
    queryFn: () =>
      adminRequest({
        url: "/departments",
        params: { search: departmentSearch || undefined },
      }),
  });

  useEffect(() => {
    if (!studentForm.departmentId && departments.length) {
      setStudentForm((prev) => ({ ...prev, departmentId: departments[0].id }));
    }
  }, [departments, studentForm.departmentId]);

  useEffect(() => {
    if (!subjectForm.departmentIds.length && departments.length) {
      setSubjectForm((prev) => ({ ...prev, departmentIds: [departments[0].id] }));
    }
  }, [departments, subjectForm.departmentIds.length]);

  const { data: periods = [] } = useQuery<Period[]>({
    queryKey: ["admin", "periods"],
    queryFn: () => adminRequest({ url: "/periods" }),
  });

  const { data: studentsPage } = useQuery({
    queryKey: ["admin", "students", studentSearch, studentDeptFilter],
    queryFn: () =>
      adminRequest({
        url: "/students",
        params: {
          search: studentSearch || undefined,
          departmentId: studentDeptFilter || undefined,
          page: 1,
          pageSize: 50,
        },
      }),
  });
  const students: Student[] = studentsPage?.data ?? [];

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["admin", "subjects", subjectSearch, subjectDeptFilter],
    queryFn: () =>
      adminRequest({
        url: "/subjects",
        params: { search: subjectSearch || undefined, departmentId: subjectDeptFilter || undefined },
      }),
  });

  const { data: registrations = [] } = useQuery<RegistrationRow[]>({
    queryKey: ["admin", "registrations", selectedTermId],
    enabled: !!selectedTermId,
    queryFn: () =>
      adminRequest({
        url: "/registrations",
        params: { termId: selectedTermId },
      }),
  });

  const { data: offeredSubjects = [] } = useQuery({
    queryKey: ["admin", "offerings", selectedTermId],
    enabled: !!selectedTermId,
    queryFn: () => adminRequest({ url: `/terms/${selectedTermId}/subjects` }),
  });

  const { data: studentSubjects = [] } = useQuery({
    queryKey: ["admin", "student-subjects", selectedTermId, selectedStudentId],
    enabled: !!selectedTermId && !!selectedStudentId,
    queryFn: () =>
      adminRequest({
        url: `/terms/${selectedTermId}/students/${selectedStudentId}/subjects`,
      }),
  });

  useEffect(() => {
    if (studentSubjects && Array.isArray(studentSubjects)) {
      const next: Record<string, string> = {};
      (studentSubjects as any[]).forEach((s) => {
        next[s.subjectId] = s.grade === null || s.grade === undefined ? "" : String(s.grade);
      });
      setGradeEdits(next);
    }
  }, [studentSubjects]);

  const { data: timetable = [] } = useQuery<TimetableEntry[]>({
    queryKey: ["admin", "timetable", selectedTermId],
    enabled: !!selectedTermId,
    queryFn: () =>
      adminRequest({
        url: `/terms/${selectedTermId}/timetable`,
      }),
  });

  const studentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        registrationId: studentForm.registrationId,
        fullName: studentForm.fullName,
        email: studentForm.email,
        departmentId: studentForm.departmentId,
        motherName: studentForm.motherName,
        phone: studentForm.phone,
        password: studentForm.password,
      };

      if (editingStudentId) {
        const data = { ...payload };
        if (!studentForm.password) {
          delete (data as any).password;
        }
        return adminRequest({
          method: "put",
          url: `/students/${editingStudentId}`,
          data,
        });
      }
      return adminRequest({ method: "post", url: "/students", data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      setStudentForm({
        registrationId: "",
        fullName: "",
        email: "",
        departmentId: departments[0]?.id ?? "",
        motherName: "",
        phone: "",
        password: "",
      });
      setEditingStudentId(null);
      toast.success("تم حفظ بيانات الطالب");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حفظ بيانات الطالب")),
  });

  const deleteStudent = useMutation({
    mutationFn: (id: string) =>
      adminRequest({ method: "delete", url: `/students/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      toast.success("تم حذف الطالب");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حذف الطالب")),
  });

  const termMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: termForm.name,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        isActive: termForm.isActive,
      };
      if (editingTermId) {
        return adminRequest({ method: "put", url: `/terms/${editingTermId}`, data: payload });
      }
      return adminRequest({ method: "post", url: "/terms", data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "terms"] });
      setTermForm({ name: "", startDate: "", endDate: "", isActive: false });
      setEditingTermId(null);
      toast.success("تم حفظ الفصل");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حفظ الفصل")),
  });

  const updateTermStatus = useMutation({
    mutationFn: (data: { id: string; body: Record<string, any> }) =>
      adminRequest({ method: "put", url: `/terms/${data.id}`, data: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "terms"] });
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث حالة الفصل")),
  });

  const deleteTerm = useMutation({
    mutationFn: (id: string) => adminRequest({ method: "delete", url: `/terms/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "terms"] });
      toast.success("تم حذف الفصل");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حذف الفصل")),
  });

  const subjectMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: subjectForm.name,
        code: subjectForm.code,
        units: Number(subjectForm.units),
        curriculumSemester: Number(subjectForm.curriculumSemester),
        departmentIds: subjectForm.departmentIds,
      };
      if (editingSubjectId) {
        return adminRequest({ method: "put", url: `/subjects/${editingSubjectId}`, data: payload });
      }
      return adminRequest({ method: "post", url: "/subjects", data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setSubjectForm({ name: "", code: "", units: "", curriculumSemester: "", departmentIds: [] });
      setEditingSubjectId(null);
      toast.success("تم حفظ المادة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حفظ المادة")),
  });

  const deleteSubject = useMutation({
    mutationFn: (id: string) => adminRequest({ method: "delete", url: `/subjects/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      toast.success("تم حذف المادة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حذف المادة")),
  });

  const bulkSubjectMutation = useMutation({
    mutationFn: (subjectsPayload: SubjectInput[]) =>
      adminRequest({ method: "post", url: "/subjects/bulk", data: { subjects: subjectsPayload } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setBulkSubjects("");
      setBulkDepartmentIds(new Set());
      toast.success("تمت إضافة المواد بالجملة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر إضافة المواد")),
  });

  const offeringsMutation = useMutation({
    mutationFn: (data: { type: "assign" | "unassign"; ids: string[] }) =>
      adminRequest({
        method: "post",
        url: `/terms/${selectedTermId}/subjects/${data.type === "assign" ? "assign" : "unassign"}`,
        data: { subjectIds: data.ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offerings", selectedTermId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "timetable", selectedTermId] });
      setSelectedSubjects(new Set());
      setSelectedOfferedSubjects(new Set());
      toast.success("تم تحديث عروض المواد");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث عروض المواد")),
  });

  const registrationsMutation = useMutation({
    mutationFn: (data: { action: "register" | "unregister"; ids: string[] }) =>
      adminRequest({
        method: "post",
        url: `/registrations/${data.action}`,
        data: { termId: selectedTermId, studentIds: data.ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "registrations", selectedTermId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "student-subjects"] });
      setRegistrationSelected(new Set());
      setRegisteredSelected(new Set());
      toast.success("تم تحديث تسجيلات الطلاب");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث التسجيل")),
  });

  const studentSubjectMutation = useMutation({
    mutationFn: (data: { action: "assign" | "unassign"; ids: string[] }) =>
      adminRequest({
        method: "post",
        url: `/terms/${selectedTermId}/students/${selectedStudentId}/subjects/${data.action === "assign" ? "assign" : "unassign"}`,
        data: { subjectIds: data.ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "student-subjects", selectedTermId, selectedStudentId],
      });
      setStudentSubjectAssign(new Set());
      setStudentSubjectRemove(new Set());
      toast.success("تم تحديث مواد الطالب");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث مواد الطالب")),
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { subjectId: string; grade: number | null }) =>
      adminRequest({
        method: "put",
        url: `/terms/${selectedTermId}/students/${selectedStudentId}/subjects/${data.subjectId}/grade`,
        data: { grade: data.grade },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "student-subjects", selectedTermId, selectedStudentId],
      });
      toast.success("تم تحديث الدرجة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث الدرجة")),
  });

  const timetableMutation = useMutation({
    mutationFn: () => {
      const payload = {
        dayOfWeek: timetableForm.dayOfWeek,
        periodId: timetableForm.periodId,
        subjectId: timetableForm.subjectId,
        roomText: timetableForm.roomText,
        lecturerText: timetableForm.lecturerText,
      };
      if (timetableEditingId) {
        return adminRequest({ method: "put", url: `/timetable/${timetableEditingId}`, data: payload });
      }
      return adminRequest({ method: "post", url: `/terms/${selectedTermId}/timetable`, data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "timetable", selectedTermId] });
      setTimetableEditingId(null);
      setTimetableForm({
        dayOfWeek: DAY_OPTIONS[0].value,
        periodId: "",
        subjectId: "",
        roomText: "",
        lecturerText: "",
      });
      toast.success("تم حفظ الجدول");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حفظ الجدول")),
  });

  const deleteTimetableEntry = useMutation({
    mutationFn: (id: string) => adminRequest({ method: "delete", url: `/timetable/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "timetable", selectedTermId] });
      toast.success("تم حذف الحصة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حذف الحصة")),
  });

  const updatePeriodMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Period> }) =>
      adminRequest({ method: "put", url: `/periods/${data.id}`, data: data.payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "periods"] });
      toast.success("تم تحديث الفترة");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر تحديث الفترة")),
  });

  const departmentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: departmentForm.name,
        code: departmentForm.code,
        isActive: departmentForm.isActive,
      };
      if (editingDepartmentId) {
        return adminRequest({ method: "put", url: `/departments/${editingDepartmentId}`, data: payload });
      }
      return adminRequest({ method: "post", url: "/departments", data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      setDepartmentForm({ name: "", code: "", isActive: true });
      setEditingDepartmentId(null);
      toast.success("تم حفظ القسم");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "تعذر حفظ القسم")),
  });

  const deleteDepartment = useMutation({
    mutationFn: (id: string) => adminRequest({ method: "delete", url: `/departments/${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      toast.success("تم حذف القسم");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "لا يمكن حذف القسم")),
  });

  const parseBulkSubjects = (): SubjectInput[] => {
    const lines = bulkSubjects
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed: SubjectInput[] = [];
    for (const line of lines) {
      const [code, name, units, sem] = line.split(",").map((s) => s.trim());
      if (!code || !name || !units || !sem) continue;
      parsed.push({
        code,
        name,
        units: Number(units),
        curriculumSemester: Number(sem),
        departmentIds: Array.from(bulkDepartmentIds),
      });
    }
    return parsed;
  };

  const toggleSetValue = (set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  };

  const offeredSubjectsOptions = useMemo(
    () =>
      (offeredSubjects || []).map((s: any) => ({
        id: s.subjectId,
        label: `${s.code || s.name} (${s.code})`,
        departments: s.departments || [],
      })),
    [offeredSubjects]
  );

  const availableSubjects = useMemo(() => {
    const offeredIds = new Set((offeredSubjects || []).map((s: any) => s.subjectId));
    return subjects.filter((s) => !offeredIds.has(s.id));
  }, [subjects, offeredSubjects]);

  const registeredStudentIds = useMemo(
    () => new Set((registrations || []).map((r) => r.studentId)),
    [registrations]
  );

  const availableStudentsForRegistration = useMemo(
    () => students.filter((s) => !registeredStudentIds.has(s.id)),
    [students, registeredStudentIds]
  );

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const assignedSubjectIdsForStudent = useMemo(
    () => new Set((studentSubjects as any[]).map((s) => s.subjectId)),
    [studentSubjects]
  );

  const selectedStudent = selectedStudentId ? studentMap.get(selectedStudentId) : undefined;
  const selectedStudentDeptId = selectedStudent?.department?.id;

  const availableOfferedForStudent = useMemo(() => {
    if (!selectedStudent) return [];
    const base = offeredSubjectsOptions.filter((s) => !assignedSubjectIdsForStudent.has(s.id));
    if (!selectedStudentDeptId) return base;
    return base.filter((s) => (s.departments || []).some((d: any) => d.id === selectedStudentDeptId));
  }, [offeredSubjectsOptions, assignedSubjectIdsForStudent, selectedStudentDeptId, selectedStudent]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
                <p className="text-muted-foreground">إدارة الطلاب والفصول والمواد والتسجيلات.</p>
              </div>
              <Badge variant="secondary">نظام أساسي (Basic Auth)</Badge>
            </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 justify-start w-full">
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="students">الطلاب</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="departments">الأقسام</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="terms">الفصول</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="subjects">المواد</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="offerings">عروض المواد</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="registrations">التسجيل</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="grades">درجات الطلاب</TabsTrigger>
              <TabsTrigger className="flex-1 min-w-[120px] text-center px-3 py-1 text-sm" value="timetable">الجدول</TabsTrigger>
            </TabsList>

            {/* Students */}
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة الطلاب</CardTitle>
                  <CardDescription>إضافة، تعديل، حذف وبحث الطلاب.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-2">
                      <Label>بحث</Label>
                      <Input
                        placeholder="اسم، بريد، رقم قيد"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Select
                        value={studentDeptFilter || "all"}
                        onValueChange={(v) => setStudentDeptFilter(v === "all" ? "" : v)}
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder="كل الأقسام" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الأقسام</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "students"] })}>
                      تحديث القائمة
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <div className="rounded-md border max-h-[500px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الرقم</TableHead>
                              <TableHead>الاسم</TableHead>
                              <TableHead>القسم</TableHead>
                              <TableHead>البريد</TableHead>
                              <TableHead>الفصول المسجلة</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((stu) => (
                              <TableRow key={stu.id}>
                                <TableCell className="font-mono">{stu.registrationId}</TableCell>
                                <TableCell>{stu.fullName}</TableCell>
                                <TableCell>{stu.department?.name || "—"}</TableCell>
                                <TableCell>{stu.email}</TableCell>
                                <TableCell>{stu.studySemestersCount}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingStudentId(stu.id);
                                      setStudentForm({
                                        registrationId: stu.registrationId,
                                        fullName: stu.fullName,
                                        email: stu.email,
                                        departmentId: stu.department?.id || "",
                                        motherName: stu.motherName,
                                        phone: stu.phone,
                                        password: "",
                                      });
                                    }}
                                  >
                                    تعديل
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteStudent.mutate(stu.id)}
                                  >
                                    حذف
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div>
                      <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{editingStudentId ? "تعديل طالب" : "إضافة طالب"}</h3>
                          {editingStudentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                                  onClick={() => {
                                    setEditingStudentId(null);
                                    setStudentForm({
                                      registrationId: "",
                                      fullName: "",
                                      email: "",
                                      departmentId: departments[0]?.id ?? "",
                                      motherName: "",
                                      phone: "",
                                      password: "",
                                    });
                                  }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>رقم القيد</Label>
                          <Input
                            required
                            value={studentForm.registrationId}
                            onChange={(e) => setStudentForm((s) => ({ ...s, registrationId: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم الكامل</Label>
                          <Input
                            required
                            value={studentForm.fullName}
                            onChange={(e) => setStudentForm((s) => ({ ...s, fullName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>البريد</Label>
                          <Input
                            required
                            value={studentForm.email}
                            onChange={(e) => setStudentForm((s) => ({ ...s, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>القسم</Label>
                          <Select
                            value={studentForm.departmentId}
                            onValueChange={(v) => setStudentForm((s) => ({ ...s, departmentId: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name} ({dept.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>اسم الأم</Label>
                          <Input
                            required
                            value={studentForm.motherName}
                            onChange={(e) => setStudentForm((s) => ({ ...s, motherName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الهاتف</Label>
                          <Input
                            required
                            value={studentForm.phone}
                            onChange={(e) => setStudentForm((s) => ({ ...s, phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كلمة المرور</Label>
                          <Input
                            type="password"
                            placeholder={editingStudentId ? "اتركها دون تغيير" : ""}
                            minLength={6}
                            value={studentForm.password}
                            onChange={(e) => setStudentForm((s) => ({ ...s, password: e.target.value }))}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (
                              !studentForm.registrationId ||
                              !studentForm.fullName ||
                              !studentForm.email ||
                              !studentForm.departmentId ||
                              !studentForm.motherName ||
                              !studentForm.phone ||
                              (!editingStudentId && !studentForm.password)
                            ) {
                              toast.error("الرجاء ملء جميع الحقول المطلوبة");
                              return;
                            }
                            if (studentForm.password && studentForm.password.length < 6) {
                              toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                              return;
                            }
                            studentMutation.mutate();
                          }}
                        >
                          {editingStudentId ? "تحديث الطالب" : "إضافة الطالب"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Departments */}
            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة الأقسام</CardTitle>
                  <CardDescription>إنشاء، تعديل، حذف الأقسام الأكاديمية.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-2">
                      <Label>بحث</Label>
                      <Input
                        placeholder="اسم أو كود"
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "departments"] })}
                    >
                      تحديث القائمة
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <div className="rounded-md border max-h-[500px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الاسم</TableHead>
                              <TableHead>الكود</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {departments.map((dept) => (
                              <TableRow key={dept.id}>
                                <TableCell>{dept.name}</TableCell>
                                <TableCell className="font-mono">{dept.code}</TableCell>
                                <TableCell>{dept.isActive ? <Badge>نشط</Badge> : <Badge variant="secondary">موقوف</Badge>}</TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingDepartmentId(dept.id);
                                      setDepartmentForm({
                                        name: dept.name,
                                        code: dept.code,
                                        isActive: dept.isActive,
                                      });
                                    }}
                                  >
                                    تعديل
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDepartment.mutate(dept.id)}
                                  >
                                    حذف
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {departments.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                                  لا توجد أقسام.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div>
                      <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{editingDepartmentId ? "تعديل قسم" : "إنشاء قسم"}</h3>
                          {editingDepartmentId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingDepartmentId(null);
                                setDepartmentForm({ name: "", code: "", isActive: true });
                              }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>اسم القسم</Label>
                          <Input
                            value={departmentForm.name}
                            onChange={(e) => setDepartmentForm((s) => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>كود القسم</Label>
                          <Input
                            value={departmentForm.code}
                            onChange={(e) => setDepartmentForm((s) => ({ ...s, code: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dept-active"
                            checked={departmentForm.isActive}
                            onCheckedChange={(v) => setDepartmentForm((s) => ({ ...s, isActive: Boolean(v) }))}
                          />
                          <Label htmlFor="dept-active">نشط</Label>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (!departmentForm.name || !departmentForm.code) {
                              toast.error("يرجى إدخال الاسم والكود");
                              return;
                            }
                            departmentMutation.mutate();
                          }}
                        >
                          {editingDepartmentId ? "تحديث القسم" : "إضافة القسم"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grades */}
            <TabsContent value="grades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>درجات الطلاب في المواد المسندة</CardTitle>
                  <CardDescription>اختر الفصل والطالب لعرض وتعديل الدرجات.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                      <Label>الفصل</Label>
                      <Select value={selectedTermId ?? ""} onValueChange={setSelectedTermId}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} {t.isActive && "(نشط)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>بحث عن الطالب</Label>
                      <Input
                        placeholder="اسم أو رقم قيد"
                        value={gradeStudentSearch}
                        onChange={(e) => setGradeStudentSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">الطلاب المسجلون</h4>
                      <ScrollArea className="h-72 border rounded-md p-3 space-y-2">
                        <RadioGroup value={selectedStudentId ?? ""} onValueChange={(v) => setSelectedStudentId(v)}>
                          {registrations
                            .filter((r) => {
                              const q = gradeStudentSearch.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                r.student.fullName.toLowerCase().includes(q) ||
                                r.student.registrationId.toLowerCase().includes(q)
                              );
                            })
                            .map((r) => (
                              <label key={r.studentId} className="flex items-center gap-2 text-sm">
                                <RadioGroupItem value={r.studentId} />
                                <span className="font-mono">{r.student.registrationId}</span>
                                <span>{r.student.fullName}</span>
                              </label>
                            ))}
                        </RadioGroup>
                        {registrations.length === 0 && (
                          <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون في هذا الفصل.</p>
                        )}
                      </ScrollArea>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">مواد الطالب ودرجاته</h4>
                      {(!studentSubjects || studentSubjects.length === 0) && (
                        <p className="text-sm text-muted-foreground">لا توجد مواد مسندة بعد.</p>
                      )}
                      {studentSubjects && studentSubjects.length > 0 && (
                        <div className="space-y-3">
                          {(studentSubjects as any[]).map((s) => (
                            <div
                              key={s.subjectId}
                              className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-md p-3"
                            >
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {s.name} ({s.code})
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  الساعات: {s.units} • الفصل الدراسي: {s.curriculumSemester}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  الدرجة الحالية: {s.grade === null || s.grade === undefined ? "غير مسجلة" : s.grade}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  placeholder="أدخل الدرجة"
                                  value={gradeEdits[s.subjectId] ?? ""}
                                  onChange={(e) =>
                                    setGradeEdits((prev) => ({ ...prev, [s.subjectId]: e.target.value }))
                                  }
                                  className="w-28"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                for (const s of studentSubjects as any[]) {
                                  const raw = gradeEdits[s.subjectId];
                                  const gradeVal =
                                    raw === "" || raw === undefined ? null : Math.min(100, Math.max(0, Number(raw)));
                                  if (raw !== "" && Number.isNaN(Number(raw))) {
                                    toast.error(`درجة غير صالحة للمادة ${s.code}. استخدم رقم بين 0 و 100`);
                                    return;
                                  }
                                  gradeMutation.mutate({ subjectId: s.subjectId, grade: gradeVal });
                                }
                              }}
                              disabled={!selectedStudentId}
                            >
                              حفظ كل الدرجات
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reset: Record<string, string> = {};
                                (studentSubjects as any[]).forEach((s) => {
                                  reset[s.subjectId] = "";
                                  gradeMutation.mutate({ subjectId: s.subjectId, grade: null });
                                });
                                setGradeEdits(reset);
                              }}
                              disabled={!selectedStudentId}
                            >
                              مسح كل الدرجات
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Terms */}
            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>الفصول الدراسية</CardTitle>
                  <CardDescription>إنشاء وتفعيل وأرشفة الفصول.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="archived"
                      checked={showArchivedTerms}
                      onCheckedChange={(v) => setShowArchivedTerms(Boolean(v))}
                    />
                    <Label htmlFor="archived">إظهار الفصول المؤرشفة</Label>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الاسم</TableHead>
                              <TableHead>التواريخ</TableHead>
                              <TableHead>الحالة</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {terms.map((term) => (
                              <TableRow key={term.id}>
                                <TableCell>{term.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {term.startDate} → {term.endDate}
                                </TableCell>
                                <TableCell className="space-x-2">
                                  {term.isActive && <Badge>نشط</Badge>}
                                  {term.isArchived && <Badge variant="secondary">مؤرشف</Badge>}
                                </TableCell>
                                <TableCell className="space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingTermId(term.id);
                                      setTermForm({
                                        name: term.name,
                                        startDate: term.startDate,
                                        endDate: term.endDate,
                                        isActive: term.isActive,
                                      });
                                    }}
                                  >
                                    تعديل
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => updateTermStatus.mutate({ id: term.id, body: { isActive: true } })}
                                  >
                                    تفعيل
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateTermStatus.mutate({
                                        id: term.id,
                                        body: { isArchived: !term.isArchived },
                                      })
                                    }
                                  >
                                    {term.isArchived ? "إلغاء الأرشفة" : "أرشفة"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTerm.mutate(term.id)}
                                  >
                                    حذف
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div>
                      <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{editingTermId ? "تعديل فصل" : "إنشاء فصل"}</h3>
                          {editingTermId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTermId(null);
                                setTermForm({ name: "", startDate: "", endDate: "", isActive: false });
                              }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>اسم الفصل</Label>
                          <Input
                            value={termForm.name}
                            onChange={(e) => setTermForm((s) => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>تاريخ البداية</Label>
                          <Input
                            type="date"
                            value={termForm.startDate}
                            onChange={(e) => setTermForm((s) => ({ ...s, startDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>تاريخ النهاية</Label>
                          <Input
                            type="date"
                            value={termForm.endDate}
                            onChange={(e) => setTermForm((s) => ({ ...s, endDate: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="isActive"
                            checked={termForm.isActive}
                            onCheckedChange={(v) => setTermForm((s) => ({ ...s, isActive: Boolean(v) }))}
                          />
                          <Label htmlFor="isActive">تفعيل مباشرة</Label>
                        </div>
                        <Button className="w-full" onClick={() => termMutation.mutate()}>
                          {editingTermId ? "تحديث الفصل" : "إنشاء الفصل"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subjects */}
            <TabsContent value="subjects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة المواد</CardTitle>
                  <CardDescription>إضافة وتعديل المواد، مع إدخال جماعي سريع.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-2">
                      <Label>بحث</Label>
                      <Input
                        placeholder="اسم أو كود"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Select
                        value={subjectDeptFilter || "all"}
                        onValueChange={(v) => setSubjectDeptFilter(v === "all" ? "" : v)}
                      >
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder="كل الأقسام" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الأقسام</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })}>
                      تحديث القائمة
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <div className="rounded-md border max-h-[500px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-32">الكود</TableHead>
                              <TableHead>الاسم</TableHead>
                              <TableHead>الأقسام</TableHead>
                              <TableHead>الساعات</TableHead>
                              <TableHead>الفصل الدراسي</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjects.map((subj) => (
                              <TableRow key={subj.id} className="text-sm">
                                <TableCell className="py-2 font-mono">{subj.code}</TableCell>
                                <TableCell className="py-2">{subj.name}</TableCell>
                                <TableCell className="space-x-1">
                                  {subj.departments?.length ? (
                                    subj.departments.slice(0, 3).map((dept) => (
                                      <Badge key={dept.id} variant="outline">
                                        {dept.code}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                  {subj.departments?.length > 3 && (
                                    <Badge variant="secondary">+{subj.departments.length - 3}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">{subj.units}</TableCell>
                                <TableCell className="py-2">{subj.curriculumSemester}</TableCell>
                                <TableCell className="py-2 flex items-center gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingSubjectId(subj.id);
                                      setSubjectForm({
                                        name: subj.name,
                                        code: subj.code,
                                        units: String(subj.units),
                                        curriculumSemester: String(subj.curriculumSemester),
                                        departmentIds: subj.departments?.map((d) => d.id) ?? [],
                                      });
                                    }}
                                  >
                                    تعديل
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteSubject.mutate(subj.id)}
                                    aria-label="حذف"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{editingSubjectId ? "تعديل مادة" : "إضافة مادة"}</h3>
                          {editingSubjectId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSubjectId(null);
                                setSubjectForm({ name: "", code: "", units: "", curriculumSemester: "", departmentIds: [] });
                              }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>الكود</Label>
                          <Input
                            value={subjectForm.code}
                            onChange={(e) => setSubjectForm((s) => ({ ...s, code: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم</Label>
                          <Input
                            value={subjectForm.name}
                            onChange={(e) => setSubjectForm((s) => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الساعات</Label>
                          <Input
                            type="number"
                            value={subjectForm.units}
                            onChange={(e) => setSubjectForm((s) => ({ ...s, units: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الفصل الدراسي (1-8)</Label>
                          <Input
                            type="number"
                            value={subjectForm.curriculumSemester}
                            onChange={(e) =>
                              setSubjectForm((s) => ({ ...s, curriculumSemester: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الأقسام المرتبطة (اختر واحداً على الأقل)</Label>
                          <ScrollArea className="h-32 border rounded-md p-2">
                            <div className="space-y-2">
                              {departments.map((dept) => (
                                <label key={dept.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={subjectForm.departmentIds.includes(dept.id)}
                                    onCheckedChange={() => {
                                      setSubjectForm((prev) => {
                                        const next = new Set(prev.departmentIds);
                                        if (next.has(dept.id)) next.delete(dept.id);
                                        else next.add(dept.id);
                                        return { ...prev, departmentIds: Array.from(next) };
                                      });
                                    }}
                                  />
                                  <span>{dept.name}</span>
                                </label>
                              ))}
                              {!departments.length && (
                                <p className="text-sm text-muted-foreground">لا توجد أقسام بعد.</p>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (!subjectForm.name || !subjectForm.code || !subjectForm.units || !subjectForm.curriculumSemester) {
                              toast.error("الرجاء إدخال جميع بيانات المادة");
                              return;
                            }
                            if (!subjectForm.departmentIds.length) {
                              toast.error("يجب اختيار قسم واحد على الأقل للمادة");
                              return;
                            }
                            subjectMutation.mutate();
                          }}
                        >
                          {editingSubjectId ? "تحديث المادة" : "إضافة المادة"}
                        </Button>
                      </div>
                      <div className="rounded-md border p-4 space-y-3">
                        <h3 className="font-semibold">إضافة جماعية</h3>
                        <p className="text-sm text-muted-foreground">
                          أدخل كل مادة في سطر بصيغة: كود,اسم,ساعات,فصل
                        </p>
                        <div className="space-y-2">
                          <Label>الأقسام المطبقة على كل المواد</Label>
                          <ScrollArea className="h-24 border rounded-md p-2">
                            <div className="space-y-2">
                              {departments.map((dept) => (
                                <label key={dept.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={bulkDepartmentIds.has(dept.id)}
                                    onCheckedChange={() =>
                                      setBulkDepartmentIds((set) => toggleSetValue(set, dept.id))
                                    }
                                  />
                                  <span>{dept.name} ({dept.code})</span>
                                </label>
                              ))}
                              {!departments.length && (
                                <p className="text-sm text-muted-foreground">لا توجد أقسام بعد.</p>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                        <Textarea
                          rows={6}
                          value={bulkSubjects}
                          onChange={(e) => setBulkSubjects(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            if (bulkDepartmentIds.size === 0) {
                              toast.error("اختر قسم واحد على الأقل للإضافة الجماعية");
                              return;
                            }
                            const parsed = parseBulkSubjects();
                            if (!parsed.length) {
                              toast.error("لا توجد بيانات صالحة");
                              return;
                            }
                            bulkSubjectMutation.mutate(parsed);
                          }}
                        >
                          حفظ الإضافة الجماعية
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Offerings */}
            <TabsContent value="offerings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تحديد المواد المعروضة في فصل</CardTitle>
                  <CardDescription>إسناد المواد للفصل المختار بشكل جماعي.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>الفصل</Label>
                      <Select value={selectedTermId ?? ""} onValueChange={setSelectedTermId}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} {t.isActive && "(نشط)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">كل المواد</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubjects(new Set(availableSubjects.map((s) => s.id)))}
                          disabled={availableSubjects.length === 0}
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubjects(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-72 border rounded-md p-3 space-y-2">
                        {availableSubjects.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedSubjects.has(s.id)}
                              onCheckedChange={() => setSelectedSubjects((set) => toggleSetValue(set, s.id))}
                            />
                            <span className="font-mono">{s.code}</span>
                            <span>{s.name}</span>
                          </label>
                        ))}
                        {availableSubjects.length === 0 && (
                          <p className="text-sm text-muted-foreground">لا توجد مواد متاحة للإسناد</p>
                        )}
                      </ScrollArea>
                      <Button
                        disabled={!selectedTermId}
                        onClick={() =>
                          offeringsMutation.mutate({ type: "assign", ids: Array.from(selectedSubjects) })
                        }
                      >
                        إسناد للترم
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">المواد المعروضة حالياً</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedOfferedSubjects(new Set((offeredSubjects || []).map((s: any) => s.subjectId)))
                          }
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOfferedSubjects(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-72 border rounded-md p-3 space-y-2">
                        {(offeredSubjects || []).map((s: any) => (
                          <label key={s.subjectId} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedOfferedSubjects.has(s.subjectId)}
                              onCheckedChange={() =>
                                setSelectedOfferedSubjects((set) => toggleSetValue(set, s.subjectId))
                              }
                            />
                            <span className="font-mono">{s.code}</span>
                            <span>{s.name}</span>
                          </label>
                        ))}
                      </ScrollArea>
                      <Button
                        variant="secondary"
                        disabled={!selectedTermId}
                        onClick={() =>
                          offeringsMutation.mutate({
                            type: "unassign",
                            ids: Array.from(selectedOfferedSubjects),
                          })
                        }
                      >
                        إزالة من الترم
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registrations */}
            <TabsContent value="registrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تسجيل الطلاب في الفصل</CardTitle>
                  <CardDescription>
                    التسجيل الجماعي وإلغاء التسجيل، مع إسناد المواد للطالب.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>الفصل</Label>
                      <Select value={selectedTermId ?? ""} onValueChange={setSelectedTermId}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} {t.isActive && "(نشط)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">كل الطلاب (تسجيل)</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRegistrationSelected(new Set(availableStudentsForRegistration.map((s) => s.id)))
                          }
                          disabled={availableStudentsForRegistration.length === 0}
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRegistrationSelected(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-72 border rounded-md p-3 space-y-2">
                        {availableStudentsForRegistration.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={registrationSelected.has(s.id)}
                              onCheckedChange={() =>
                                setRegistrationSelected((set) => toggleSetValue(set, s.id))
                              }
                            />
                            <span className="font-mono">{s.registrationId}</span>
                            <span>{s.fullName}</span>
                          </label>
                        ))}
                        {availableStudentsForRegistration.length === 0 && (
                          <p className="text-sm text-muted-foreground">جميع الطلاب مسجلون بالفعل في هذا الفصل.</p>
                        )}
                      </ScrollArea>
                      <Button
                        disabled={!selectedTermId}
                        onClick={() =>
                          registrationsMutation.mutate({
                            action: "register",
                            ids: Array.from(registrationSelected),
                          })
                        }
                      >
                        تسجيل المحدد
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">المسجلون حالياً (إلغاء التسجيل)</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRegisteredSelected(new Set(registrations.map((r) => r.studentId)))
                          }
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRegisteredSelected(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-72 border rounded-md p-3 space-y-2">
                        {registrations.map((r) => (
                          <label key={r.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={registeredSelected.has(r.studentId)}
                              onCheckedChange={() =>
                                setRegisteredSelected((set) => toggleSetValue(set, r.studentId))
                              }
                            />
                            <span className="font-mono">{r.student.registrationId}</span>
                            <span>{r.student.fullName}</span>
                          </label>
                        ))}
                      </ScrollArea>
                      <Button
                        variant="secondary"
                        disabled={!selectedTermId}
                        onClick={() =>
                          registrationsMutation.mutate({
                            action: "unregister",
                            ids: Array.from(registeredSelected),
                          })
                        }
                      >
                        إلغاء تسجيل المحدد
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="space-y-2">
                        <Label>طالب مسجل</Label>
                        <Select
                          value={selectedStudentId ?? ""}
                          onValueChange={(v) => {
                            setSelectedStudentId(v);
                            setStudentSubjectAssign(new Set());
                            setStudentSubjectRemove(new Set());
                          }}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="اختر الطالب" />
                          </SelectTrigger>
                          <SelectContent>
                            {registrations.map((r) => (
                              <SelectItem key={r.studentId} value={r.studentId}>
                                {r.student.fullName} ({r.student.registrationId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">إسناد مواد للطالب</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStudentSubjectAssign(new Set(availableOfferedForStudent.map((s) => s.id)))}
                          disabled={availableOfferedForStudent.length === 0}
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStudentSubjectAssign(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-64 border rounded-md p-3 space-y-2">
                        {availableOfferedForStudent.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={studentSubjectAssign.has(s.id)}
                              onCheckedChange={() =>
                                setStudentSubjectAssign((set) => toggleSetValue(set, s.id))
                              }
                            />
                            <span>{s.label}</span>
                          </label>
                        ))}
                        {availableOfferedForStudent.length === 0 && (
                          <p className="text-sm text-muted-foreground">لا توجد مواد متاحة لإسنادها لهذا الطالب.</p>
                        )}
                        </ScrollArea>
                        <Button
                          onClick={() =>
                            studentSubjectMutation.mutate({
                              action: "assign",
                              ids: Array.from(studentSubjectAssign),
                            })
                          }
                          disabled={!selectedStudentId}
                        >
                          إسناد للطالب
                        </Button>
                      </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">المواد المسندة حالياً</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setStudentSubjectRemove(new Set((studentSubjects as any[]).map((s) => s.subjectId)))
                          }
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStudentSubjectRemove(new Set())}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>
                      <ScrollArea className="h-64 border rounded-md p-3 space-y-2">
                        {(studentSubjects || []).map((s: any) => (
                          <label key={s.subjectId} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={studentSubjectRemove.has(s.subjectId)}
                                onCheckedChange={() =>
                                  setStudentSubjectRemove((set) => toggleSetValue(set, s.subjectId))
                                }
                              />
                              <span className="font-mono">{s.code}</span>
                              <span>{s.name}</span>
                            </label>
                          ))}
                        </ScrollArea>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            studentSubjectMutation.mutate({
                              action: "unassign",
                              ids: Array.from(studentSubjectRemove),
                            })
                          }
                          disabled={!selectedStudentId}
                        >
                          إزالة من الطالب
                        </Button>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timetable */}
            <TabsContent value="timetable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>الجدول الدراسي</CardTitle>
                  <CardDescription>3 فترات يومياً من السبت إلى الخميس.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>الفصل</Label>
                      <Select value={selectedTermId ?? ""} onValueChange={setSelectedTermId}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} {t.isActive && "(نشط)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>اليوم \\ الفترة</TableHead>
                                          {periods.map((p) => (
                                            <TableHead key={p.id}>{p.label}</TableHead>
                                          ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {DAY_OPTIONS.map((day) => (
                                          <TableRow key={day.value}>
                                            <TableCell className="font-semibold">{day.label}</TableCell>
                                            {periods.map((p) => {
                                              const entries = (timetable || []).filter(
                                                (tt) => tt.dayOfWeek === day.value && tt.periodId === p.id
                                              );
                                              return (
                                                <TableCell key={p.id} className="align-top">
                                                  {entries.length === 0 ? (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {entries.map((tt) => (
                                                        <div
                                                          key={tt.id}
                                                          className="border rounded-md p-2 cursor-pointer space-y-1"
                                                          onClick={() => {
                                                            setTimetableEditingId(tt.id);
                                                            setTimetableForm({
                                                              dayOfWeek: tt.dayOfWeek,
                                                              periodId: tt.periodId,
                                                              subjectId: tt.subjectId,
                                                              roomText: tt.roomText || "",
                                                              lecturerText: tt.lecturerText || "",
                                                            });
                                                          }}
                                                        >
                                                          <div className="flex items-center justify-between gap-2">
                                                            <div className="font-semibold text-sm">
                                                              {tt.subject?.name || tt.subjectId}
                                                            </div>
                                                            <Button
                                                              size="icon"
                                                              variant="ghost"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteTimetableEntry.mutate(tt.id);
                                                              }}
                                                              aria-label="حذف"
                                                            >
                                                              <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                          </div>
                                                          <div className="text-xs text-muted-foreground">
                                                            {tt.roomText || ""} {tt.lecturerText ? `• ${tt.lecturerText}` : ""}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </TableCell>
                                              );
                                            })}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>

                    <div className="space-y-4">
                      <div className="rounded-md border p-4 space-y-3">
                        <h3 className="font-semibold">
                          {timetableEditingId ? "تعديل حصة" : "إضافة حصة"}
                        </h3>
                        <div className="space-y-2">
                          <Label>اليوم</Label>
                          <Select
                            value={timetableForm.dayOfWeek}
                            onValueChange={(v) => setTimetableForm((s) => ({ ...s, dayOfWeek: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر اليوم" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAY_OPTIONS.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>الفترة</Label>
                          <Select
                            value={timetableForm.periodId}
                            onValueChange={(v) => setTimetableForm((s) => ({ ...s, periodId: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفترة" />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.label} ({p.startTime} - {p.endTime})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>المادة</Label>
                          <Select
                            value={timetableForm.subjectId}
                            onValueChange={(v) => setTimetableForm((s) => ({ ...s, subjectId: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المادة" />
                            </SelectTrigger>
                            <SelectContent>
                              {(offeredSubjects || []).map((s: any) => (
                                <SelectItem key={s.subjectId} value={s.subjectId}>
                                  {s.code} - {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>القاعات / المدرس</Label>
                          <Input
                            placeholder="الغرفة"
                            value={timetableForm.roomText}
                            onChange={(e) => setTimetableForm((s) => ({ ...s, roomText: e.target.value }))}
                          />
                          <Input
                            placeholder="المدرس"
                            value={timetableForm.lecturerText}
                            onChange={(e) => setTimetableForm((s) => ({ ...s, lecturerText: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            disabled={
                              !selectedTermId || !timetableForm.periodId || !timetableForm.subjectId
                            }
                            onClick={() => timetableMutation.mutate()}
                          >
                            {timetableEditingId ? "تحديث" : "إضافة"}
                          </Button>
                          {timetableEditingId && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setTimetableEditingId(null);
                                setTimetableForm({
                                  dayOfWeek: DAY_OPTIONS[0].value,
                                  periodId: "",
                                  subjectId: "",
                                  roomText: "",
                                  lecturerText: "",
                                });
                              }}
                            >
                              إلغاء
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-md border p-4 space-y-3">
                        <h3 className="font-semibold">تعديل الفترات (3 فقط)</h3>
                        <div className="space-y-3">
                          {periods.map((p) => (
                            <div key={p.id} className="space-y-2 border rounded-md p-2">
                              <div className="space-y-1">
                                <Label>العنوان</Label>
                                <Input
                                  defaultValue={p.label}
                                  onBlur={(e) =>
                                    updatePeriodMutation.mutate({
                                      id: p.id,
                                      payload: { label: e.target.value },
                                    })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label>بداية</Label>
                                  <Input
                                    type="time"
                                    defaultValue={p.startTime}
                                    onBlur={(e) =>
                                      updatePeriodMutation.mutate({
                                        id: p.id,
                                        payload: { startTime: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>نهاية</Label>
                                  <Input
                                    type="time"
                                    defaultValue={p.endTime}
                                    onBlur={(e) =>
                                      updatePeriodMutation.mutate({
                                        id: p.id,
                                        payload: { endTime: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
