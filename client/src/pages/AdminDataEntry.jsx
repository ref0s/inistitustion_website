import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// shadcn/ui Select
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

const AdminDataEntry = () => {
  // Reference lists
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Department form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Semester form
  const [semLabel, setSemLabel] = useState("");
  const [semYear, setSemYear] = useState(""); // keep as string; convert on submit
  const [semTerm, setSemTerm] = useState(""); // keep as string; convert on submit
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

  // load existing options (if you have GET /api/bootstrap)
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // expecting: { departments: [], subjects: [], semesters: [] }
        const { data } = await axios.get(`${API_BASE}/api/bootstrap`);
        setDepartments(data.departments ?? []);
        setSubjects(data.subjects ?? []);
        setSemesters(data.semesters ?? []);
      } catch {
        // if /api/bootstrap not available, it will just stay empty
      }
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
    if (!semLabel || semYear === "" || semTerm === "") {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/api/semesters`, {
        label: semLabel,
        year: Number(semYear),
        term_number: Number(semTerm),
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
      toast.success(`تمت إضافة الطالب: ${data.full_name}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "فشل إضافة الطالب");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <h1 className="text-3xl font-bold text-center">لوحة إدارة البيانات الأكاديمية</h1>

          {/* Grid: Departments & Semesters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department */}
            <Card>
              <CardHeader>
                <CardTitle>إضافة قسم</CardTitle>
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

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-2">الأقسام الحالية</h3>
                  <div className="space-y-1 max-h-40 overflow-auto border rounded p-3">
                    {departments.length === 0 && (
                      <p className="text-sm text-muted-foreground">لا توجد أقسام بعد</p>
                    )}
                    {departments.map((d) => (
                      <div key={d.id} className="text-sm flex justify-between">
                        <span className="font-mono">{d.code || "-"}</span>
                        <span>{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Semester */}
            <Card>
              <CardHeader>
                <CardTitle>إضافة فصل دراسي</CardTitle>
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
                        required
                      />
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

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-2">الفصول الحالية</h3>
                  <div className="space-y-1 max-h-40 overflow-auto border rounded p-3">
                    {semesters.length === 0 && (
                      <p className="text-sm text-muted-foreground">لا توجد فصول بعد</p>
                    )}
                    {semesters.map((s) => (
                      <div key={s.id} className="text-sm flex justify-between">
                        <span className="font-mono">
                          {s.year}-{s.term_number}
                        </span>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid: Subjects & Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject */}
            <Card>
              <CardHeader>
                <CardTitle>إضافة مادة</CardTitle>
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

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-2">المواد الحالية</h3>
                  <div className="space-y-1 max-h-40 overflow-auto border rounded p-3">
                    {subjects.length === 0 && (
                      <p className="text-sm text-muted-foreground">لا توجد مواد بعد</p>
                    )}
                    {subjects.map((s) => (
                      <div key={s.id} className="text-sm flex justify-between">
                        <span className="font-mono">{s.code}</span>
                        <span>{s.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student */}
            <Card>
              <CardHeader>
                <CardTitle>إضافة طالب</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  <Button type="submit" className="w-full">إضافة الطالب</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDataEntry;
