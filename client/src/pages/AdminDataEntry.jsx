import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building2, CalendarDays, BookOpen, Users, ListChecks, Clock } from "lucide-react";

// shadcn/ui Select
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

const DAY_OPTIONS = [
  { value: "saturday", label: "السبت" },
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الإثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
];

const TIME_SLOTS = [
  { value: "09:00-11:00", label: "9:00 - 11:00", start: "09:00", end: "11:00" },
  { value: "11:00-13:00", label: "11:00 - 13:00", start: "11:00", end: "13:00" },
  { value: "13:00-15:00", label: "13:00 - 15:00", start: "13:00", end: "15:00" },
];

const AdminDataEntry = () => {
  // Reference lists
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [scheduleEntries, setScheduleEntries] = useState([]);

  // Department form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Semester form
  const [semLabel, setSemLabel] = useState("");
  const [semYear, setSemYear] = useState(""); // keep as string; convert on submit
  const [semTerm, setSemTerm] = useState(""); // optional; auto-generated if empty
  const [semStart, setSemStart] = useState("");
  const [semEnd, setSemEnd] = useState("");

  // Subject form
  const [subjCode, setSubjCode] = useState("");
  const [subjTitle, setSubjTitle] = useState("");
  const [subjCredits, setSubjCredits] = useState(""); // string → Number on submit
  const [subjDeptId, setSubjDeptId] = useState("");

  // Student form
  const [stuRollId, setStuRollId] = useState("");
  const [stuName, setStuName] = useState("");
  const [stuFullName, setStuFullName] = useState("");
  const [stuDeptId, setStuDeptId] = useState("");
  const [stuCurrentSemId, setStuCurrentSemId] = useState("");
  const [stuGpa, setStuGpa] = useState(""); // string → Number on submit
  const [stuState, setStuState] = useState("active");
  const [stuEmail, setStuEmail] = useState("");
  const [stuPassword, setStuPassword] = useState("");
  const [activeSection, setActiveSection] = useState("departments");

  // Enrollment form
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollSubjectId, setEnrollSubjectId] = useState("");
  const [enrollSemesterId, setEnrollSemesterId] = useState("");
  const [enrollGrade, setEnrollGrade] = useState("");

  // Schedule form
  const [scheduleSubjectId, setScheduleSubjectId] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleSlot, setScheduleSlot] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState("");

  const loadStudents = async () => {
    try {
      const { data: studentsData } = await axios.get(`${API_BASE}/api/students`);
      setStudents(studentsData ?? []);
    } catch {
      // if /api/students not available, it will just stay empty
    }
  };

  const loadSchedule = async () => {
    try {
      const { data: scheduleData } = await axios.get(`${API_BASE}/api/schedule`);
      setScheduleEntries(scheduleData ?? []);
    } catch {
      // if /api/schedule not available, it will just stay empty
    }
  };

  // load existing options (if you have GET /api/bootstrap)
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // expecting: { departments: [], subjects: [], semesters: [] }
        const { data: boot } = await axios.get(`${API_BASE}/api/bootstrap`);
        setDepartments(boot.departments ?? []);
        setSubjects(boot.subjects ?? []);
        setSemesters(boot.semesters ?? []);
      } catch {
        // if /api/bootstrap not available, it will just stay empty
      }
      await loadStudents();
      await loadSchedule();
    };
    bootstrap();
  }, []);

  // helpers to prepend new item to state lists
  const pushDepartment = (d) => setDepartments((prev) => [d, ...prev]);
  const pushSemester = (s) => setSemesters((prev) => [s, ...prev]);
  const pushSubject = (s) => setSubjects((prev) => [s, ...prev]);

  // --- Submit handlers ---

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE}/api/departments`, {
        name: deptName,
        code: deptCode || null,
      });
      pushDepartment(data);
      setDeptName("");
      setDeptCode("");
      toast.success("تمت إضافة القسم بنجاح");
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل إضافة القسم");
    }
  };

  const handleAddSemester = async (e) => {
    e.preventDefault();
    if (!semLabel || semYear === "") {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/api/semesters`, {
        label: semLabel,
        year: Number(semYear),
        term_number: semTerm === "" ? null : Number(semTerm),
        starts_on: semStart || null,
        ends_on: semEnd || null,
      });
      pushSemester(data);
      setSemLabel("");
      setSemYear("");
      setSemTerm("");
      setSemStart("");
      setSemEnd("");
      toast.success("تمت إضافة الفصل بنجاح");
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل إضافة الفصل");
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjDeptId) {
      toast.error("اختر القسم للمادة");
      return;
    }
    if (subjCredits === "") {
      toast.error("أدخل الساعات المعتمدة");
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/api/subjects`, {
        code: subjCode,
        title: subjTitle,
        credit_hours: Number(subjCredits),
        department_id: subjDeptId,
      });
      pushSubject(data);
      setSubjCode("");
      setSubjTitle("");
      setSubjCredits("");
      setSubjDeptId("");
      toast.success("تمت إضافة المادة بنجاح");
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل إضافة المادة");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!stuDeptId) {
      toast.error("اختر قسم الطالب");
      return;
    }
    if (!stuCurrentSemId) {
      toast.error("اختر الفصل الحالي للطالب");
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/api/students`, {
        roll_id: stuRollId,
        name: stuName,
        full_name: stuFullName,
        department_id: stuDeptId,
        current_semester_id: stuCurrentSemId,
        gpa_total: stuGpa === "" ? 0 : Number(stuGpa),
        registration_state: stuState,
        email: stuEmail,
        password: stuPassword, // plain text per your current setup
      });
      // reset form
      setStuRollId("");
      setStuName("");
      setStuFullName("");
      setStuDeptId("");
      setStuCurrentSemId("");
      setStuGpa("");
      setStuState("active");
      setStuEmail("");
      setStuPassword("");
      await loadStudents();
      toast.success(`تمت إضافة الطالب: ${data.full_name}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل إضافة الطالب");
    }
  };

  const handleAddEnrollment = async (e) => {
    e.preventDefault();
    if (!enrollStudentId) {
      toast.error("اختر الطالب للتسجيل");
      return;
    }
    if (!enrollSubjectId) {
      toast.error("اختر المادة للتسجيل");
      return;
    }
    if (!enrollSemesterId) {
      toast.error("اختر الفصل الدراسي");
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/enrollments`, {
        student_id: enrollStudentId,
        subject_id: enrollSubjectId,
        semester_id: enrollSemesterId,
        subject_grade: enrollGrade === "" ? null : Number(enrollGrade),
      });
      setEnrollSubjectId("");
      setEnrollGrade("");
      toast.success("تم تسجيل المادة للطالب");
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل تسجيل المادة");
    }
  };

  const resetScheduleForm = () => {
    setScheduleSubjectId("");
    setScheduleDay("");
    setScheduleSlot("");
    setEditingScheduleId("");
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleSubjectId) {
      toast.error("اختر المادة");
      return;
    }
    if (!scheduleDay) {
      toast.error("اختر اليوم");
      return;
    }
    if (!scheduleSlot) {
      toast.error("اختر الوقت");
      return;
    }
    const slot = TIME_SLOTS.find((s) => s.value === scheduleSlot);
    if (!slot) {
      toast.error("الوقت غير صالح");
      return;
    }
    const payload = {
      subject_id: scheduleSubjectId,
      day_of_week: scheduleDay,
      start_time: slot.start,
      end_time: slot.end,
    };
    try {
      if (editingScheduleId) {
        await axios.put(`${API_BASE}/api/schedule/${editingScheduleId}`, payload);
        toast.success("تم تحديث الحصة");
      } else {
        await axios.post(`${API_BASE}/api/schedule`, payload);
        toast.success("تمت إضافة الحصة");
      }
      await loadSchedule();
      resetScheduleForm();
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل حفظ الحصة");
    }
  };

  const handleEditSchedule = (entry) => {
    const start = entry.start_time?.slice(0, 5);
    const end = entry.end_time?.slice(0, 5);
    const slotValue = start && end ? `${start}-${end}` : "";
    setScheduleSubjectId(entry.subject_id);
    setScheduleDay(entry.day_of_week);
    setScheduleSlot(slotValue);
    setEditingScheduleId(entry.id);
  };

  const handleDeleteSchedule = async (entryId) => {
    try {
      await axios.delete(`${API_BASE}/api/schedule/${entryId}`);
      await loadSchedule();
      toast.success("تم حذف الحصة");
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل حذف الحصة");
    }
  };

  const selectedStudent = students.find((s) => s.id === enrollStudentId);
  const availableSubjects = selectedStudent
    ? subjects.filter((s) => s.department_id === selectedStudent.department_id)
    : subjects;

  const scheduleByCell = useMemo(() => {
    const map = {};
    (scheduleEntries || []).forEach((entry) => {
      const start = entry.start_time?.slice(0, 5);
      const end = entry.end_time?.slice(0, 5);
      const slotKey = start && end ? `${start}-${end}` : "";
      const cellKey = `${entry.day_of_week}-${slotKey}`;
      if (!map[cellKey]) {
        map[cellKey] = [];
      }
      map[cellKey].push(entry);
    });
    return map;
  }, [scheduleEntries]);

  useEffect(() => {
    if (selectedStudent?.current_semester_id) {
      setEnrollSemesterId(selectedStudent.current_semester_id);
    } else {
      setEnrollSemesterId("");
    }
  }, [selectedStudent]);

  const sections = [
    {
      id: "departments",
      label: "الأقسام",
      icon: Building2,
      badge: `${departments.length} قسم`,
    },
    {
      id: "semesters",
      label: "الفصول",
      icon: CalendarDays,
      badge: `${semesters.length} فصل`,
    },
    {
      id: "subjects",
      label: "المواد",
      icon: BookOpen,
      badge: `${subjects.length} مادة`,
    },
    {
      id: "schedule",
      label: "الجدول الأسبوعي",
      icon: Clock,
      badge: `${scheduleEntries.length} حصة`,
    },
    {
      id: "students",
      label: "الطلاب",
      icon: Users,
      badge: "إضافة",
    },
    {
      id: "enrollments",
      label: "تسجيل المواد",
      icon: ListChecks,
      badge: "إسناد",
    },
  ];

  const sectionContent = {
    departments: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">الأقسام</h2>
            <p className="text-sm text-muted-foreground">
              إنشاء أقسام أكاديمية لتستخدمها في المواد والطلاب.
            </p>
          </div>
          <Badge variant="secondary">{departments.length} قسم</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة قسم</CardTitle>
              <CardDescription>أدخل اسم القسم والرمز إن وجد.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deptName">اسم القسم</Label>
                  <Input
                    id="deptName"
                    placeholder="علوم الحاسوب"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deptCode">رمز القسم (اختياري)</Label>
                  <Input
                    id="deptCode"
                    placeholder="CS"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="text-right"
                  />
                </div>
                <Button type="submit" className="w-full">إضافة القسم</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الأقسام الحالية</CardTitle>
              <CardDescription>القائمة تتحدث بعد الإضافة مباشرة.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md border">
                <div className="space-y-2 p-3 text-right">
                  {departments.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا توجد أقسام بعد</p>
                  )}
                  {departments.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">{d.code || "-"}</span>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    semesters: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">الفصول الدراسية</h2>
            <p className="text-sm text-muted-foreground">
              حدّد الفصول الحالية والقديمة لتتبع نتائج الطلاب.
            </p>
          </div>
          <Badge variant="secondary">{semesters.length} فصل</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة فصل دراسي</CardTitle>
              <CardDescription>أدخل الوصف والسنة ورقم الفصل.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSemester} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="semLabel">اسم/وصف الفصل</Label>
                  <Input
                    id="semLabel"
                    placeholder="Fall 2025"
                    value={semLabel}
                    onChange={(e) => setSemLabel(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="semYear">السنة</Label>
                    <Input
                      id="semYear"
                      type="number"
                      placeholder="2025"
                      value={semYear}
                      onChange={(e) => setSemYear(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semTerm">رقم الفصل</Label>
                    <Input
                      id="semTerm"
                      type="number"
                      placeholder="1"
                      value={semTerm}
                      onChange={(e) => setSemTerm(e.target.value)}
                      className="text-right"
                    />
                    <p className="text-xs text-muted-foreground">اتركه فارغًا ليتم توليده تلقائيًا</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="semStart">تاريخ البداية (اختياري)</Label>
                    <Input
                      id="semStart"
                      type="date"
                      value={semStart}
                      onChange={(e) => setSemStart(e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semEnd">تاريخ النهاية (اختياري)</Label>
                    <Input
                      id="semEnd"
                      type="date"
                      value={semEnd}
                      onChange={(e) => setSemEnd(e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">إضافة الفصل</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الفصول الحالية</CardTitle>
              <CardDescription>مرتبة حسب السنة والفصل.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md border">
                <div className="space-y-2 p-3 text-right">
                  {semesters.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا توجد فصول بعد</p>
                  )}
                  {semesters.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">
                        {s.year}-{s.term_number}
                      </span>
                      <span className="font-medium">{s.label}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    subjects: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">المواد</h2>
            <p className="text-sm text-muted-foreground">
              اربط كل مادة بقسم محدد لتسهيل التسجيل.
            </p>
          </div>
          <Badge variant="secondary">{subjects.length} مادة</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة مادة</CardTitle>
              <CardDescription>المادة تتطلب رمزًا وساعات معتمدة.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="subjCode">رمز المادة</Label>
                    <Input
                      id="subjCode"
                      placeholder="CS101"
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjCredits">الساعات المعتمدة</Label>
                    <Input
                      id="subjCredits"
                      type="number"
                      placeholder="3"
                      value={subjCredits}
                      onChange={(e) => setSubjCredits(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjTitle">اسم المادة</Label>
                  <Input
                    id="subjTitle"
                    placeholder="Introduction to Programming"
                    value={subjTitle}
                    onChange={(e) => setSubjTitle(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Select value={subjDeptId} onValueChange={(v) => setSubjDeptId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">إضافة المادة</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المواد الحالية</CardTitle>
              <CardDescription>مرتبة حسب رمز المادة.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md border">
                <div className="space-y-2 p-3 text-right">
                  {subjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا توجد مواد بعد</p>
                  )}
                  {subjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">{s.code}</span>
                      <span className="font-medium">{s.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    schedule: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">الجدول الأسبوعي للمواد</h2>
            <p className="text-sm text-muted-foreground">
              حدّد اليوم والوقت لكل مادة ضمن الجدول الأسبوعي العام.
            </p>
          </div>
          <Badge variant="secondary">{scheduleEntries.length} حصة</Badge>
        </div>
        <div className="grid grid-cols-[30%_70%] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingScheduleId ? "تعديل الحصة" : "إضافة حصة"}</CardTitle>
              <CardDescription>الأوقات المتاحة ثلاث فترات ثابتة يومياً.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-2">
                  <Label>المادة</Label>
                  <Select value={scheduleSubjectId} onValueChange={(v) => setScheduleSubjectId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} — {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>اليوم</Label>
                    <Select value={scheduleDay} onValueChange={(v) => setScheduleDay(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر اليوم" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OPTIONS.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الوقت</Label>
                    <Select value={scheduleSlot} onValueChange={(v) => setScheduleSlot(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الفترة" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full">
                    {editingScheduleId ? "حفظ التعديل" : "إضافة الحصة"}
                  </Button>
                  {editingScheduleId && (
                    <Button type="button" variant="outline" onClick={resetScheduleForm}>
                      إلغاء التعديل
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>الحصص الحالية</CardTitle>
              <CardDescription>رتّب الحصص حسب اليوم والوقت لتسهيل المراجعة.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[28rem] rounded-md border">
                <div className="p-3">
                  {scheduleEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-right">لا توجد حصص بعد</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الوقت</TableHead>
                          {DAY_OPTIONS.map((day) => (
                            <TableHead key={day.value} className="text-right">
                              {day.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {TIME_SLOTS.map((slot) => (
                          <TableRow key={slot.value}>
                            <TableCell className="text-right font-medium">{slot.label}</TableCell>
                            {DAY_OPTIONS.map((day) => {
                              const cellKey = `${day.value}-${slot.value}`;
                              const entries = scheduleByCell[cellKey] || [];
                              return (
                                <TableCell key={cellKey} className="text-right align-top">
                                  {entries.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : (
                                    <div className="space-y-2">
                                      {entries.map((entry) => (
                                        <div key={entry.id} className="rounded-md border px-2 py-1 space-y-2">
                                          <div>
                                            <p className="text-sm font-medium">{entry.subject_title}</p>
                                            <p className="text-xs text-muted-foreground">{entry.subject_code}</p>
                                          </div>
                                          <div className="flex items-center justify-end gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleEditSchedule(entry)}
                                            >
                                              تعديل
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => handleDeleteSchedule(entry.id)}
                                            >
                                              حذف
                                            </Button>
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
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    students: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">الطلاب</h2>
            <p className="text-sm text-muted-foreground">
              تأكد من اختيار القسم والفصل الحالي قبل الحفظ.
            </p>
          </div>
          <Badge variant="secondary">{students.length} طالب</Badge>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إضافة طالب</CardTitle>
              <CardDescription>البيانات ستُستخدم لتسجيل الدخول وعرض السجل الأكاديمي.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stuRollId">رقم القيد</Label>
                    <Input
                      id="stuRollId"
                      placeholder="2025-SE-001"
                      value={stuRollId}
                      onChange={(e) => setStuRollId(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stuGpa">المعدل (0-100)</Label>
                    <Input
                      id="stuGpa"
                      type="number"
                      placeholder="85.5"
                      value={stuGpa}
                      onChange={(e) => setStuGpa(e.target.value)}
                      className="text-right"
                      min={0}
                      max={100}
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stuName">الاسم المختصر</Label>
                    <Input
                      id="stuName"
                      placeholder="Ali"
                      value={stuName}
                      onChange={(e) => setStuName(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stuFullName">الاسم الكامل</Label>
                    <Input
                      id="stuFullName"
                      placeholder="Ali Mohamed El-Sayed"
                      value={stuFullName}
                      onChange={(e) => setStuFullName(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>القسم</Label>
                    <Select value={stuDeptId} onValueChange={(v) => setStuDeptId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} {d.code ? `(${d.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الفصل الحالي</Label>
                    <Select value={stuCurrentSemId} onValueChange={(v) => setStuCurrentSemId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الفصل" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label} — {s.year}/{s.term_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stuState">حالة التسجيل</Label>
                    <Input
                      id="stuState"
                      placeholder="active / suspended / graduated"
                      value={stuState}
                      onChange={(e) => setStuState(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stuEmail">البريد الإلكتروني</Label>
                    <Input
                      id="stuEmail"
                      type="email"
                      placeholder="ali.mohamed@example.com"
                      value={stuEmail}
                      onChange={(e) => setStuEmail(e.target.value)}
                      className="text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stuPassword">كلمة المرور</Label>
                  <Input
                    id="stuPassword"
                    type="password"
                    placeholder="••••••••"
                    value={stuPassword}
                    onChange={(e) => setStuPassword(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">إضافة الطالب</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الطلاب المسجلون</CardTitle>
              <CardDescription>القائمة تُحدّث تلقائياً بعد الإضافة.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-56 rounded-md border">
                <div className="space-y-2 p-3 text-right">
                  {students.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا توجد بيانات طلاب بعد</p>
                  )}
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground text-xs">
                        <p>{s.department_name || "—"}</p>
                        <p>{s.current_semester_label || "بدون فصل حالي"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{s.full_name}</p>
                        <p className="font-mono text-muted-foreground">{s.roll_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    enrollments: (
      <div className="space-y-6 text-right">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-bold">تسجيل المواد</h2>
            <p className="text-sm text-muted-foreground">
              اختر الطالب والمادة والفصل لإتمام عملية التسجيل.
            </p>
          </div>
          <Badge variant="secondary">تسجيل جديد</Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>نموذج تسجيل مادة</CardTitle>
            <CardDescription>المواد المعروضة تتبع قسم الطالب المختار.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEnrollment} className="space-y-4">
              <div className="space-y-2">
                <Label>الطالب</Label>
                <Select value={enrollStudentId} onValueChange={(v) => setEnrollStudentId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} ({s.roll_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStudent && (
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.department_name} • الفصل الحالي:{" "}
                    {selectedStudent.current_semester_label || "غير محدد"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={enrollSubjectId} onValueChange={(v) => setEnrollSubjectId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} — {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStudent && availableSubjects.length === 0 && (
                  <p className="text-xs text-muted-foreground">لا توجد مواد مرتبطة بقسم الطالب.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الفصل الدراسي</Label>
                  <Select value={enrollSemesterId} onValueChange={(v) => setEnrollSemesterId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الفصل" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label} — {s.year}/{s.term_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollGrade">الدرجة (اختياري)</Label>
                  <Input
                    id="enrollGrade"
                    type="number"
                    placeholder="85"
                    value={enrollGrade}
                    onChange={(e) => setEnrollGrade(e.target.value)}
                    className="text-right"
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">تسجيل المادة</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    ),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-8 text-right">
          <div className="space-y-3 text-center">
            <Badge variant="secondary" className="mx-auto">لوحة الإدارة</Badge>
            <h1 className="text-3xl font-bold">لوحة إدارة البيانات الأكاديمية</h1>
            <p className="text-muted-foreground">
              أضف البيانات بالترتيب المقترح: الأقسام ثم الفصول ثم المواد ثم الطلاب.
            </p>
          </div>

          <Card>
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">مسار الإعداد السريع</p>
                <p className="font-semibold">ابدأ بتعريف الهيكل الأكاديمي قبل إدخال الطلاب</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">1. الأقسام</Badge>
                <Badge variant="outline">2. الفصول</Badge>
                <Badge variant="outline">3. المواد</Badge>
                <Badge variant="outline">4. الطلاب</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-row items-start gap-8">
            <div className="min-w-0 flex-1 space-y-6">
              {sectionContent[activeSection]}
            </div>

            <aside className="h-fit w-[260px] shrink-0">
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="text-lg">أقسام الإدارة</CardTitle>
                  <CardDescription>تنقّل بسرعة بين النماذج</CardDescription>
                </CardHeader>
                <CardContent>
                  <nav className="flex flex-col gap-2">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          type="button"
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`group flex min-w-[200px] items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                            isActive
                              ? "border-primary bg-primary/10 text-foreground shadow-sm"
                              : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <span className="flex flex-row-reverse items-center gap-2">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                              }`}
                            />
                            <span className="font-medium">{section.label}</span>
                          </span>
                          <Badge variant="secondary">{section.badge}</Badge>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDataEntry;
