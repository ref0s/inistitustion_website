import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, GraduationCap, BookOpen, Calendar, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useStudentAuth } from "@/context/StudentAuthContext";

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

const StudentDashboard = () => {
  const { studentData } = useStudentAuth();

  const {
    data: scheduleData = [],
    isLoading: scheduleLoading,
    isError: scheduleError,
  } = useQuery({
    queryKey: ["weekly-schedule"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/schedule`);
      return data;
    },
    enabled: !!studentData,
  });

  if (!studentData) {
    // direct visit to /dashboard without login → send back
    return <Navigate to="/login" replace />;
  }

  const { headerCards, personalInfo, academicRecord } = studentData;

  const scheduleByCell = useMemo(() => {
    const map: Record<string, any[]> = {};
    (scheduleData || []).forEach((entry: any) => {
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
  }, [scheduleData]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">لوحة الطالب الأكاديمية</h1>
          </div>

          {/* Top cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">البيانات الشخصية</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">{personalInfo.fullName}</div>
                <p className="text-xs text-muted-foreground text-right">رقم القيد: {personalInfo.rollId}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">القسم الأكاديمي</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">{personalInfo.department}</div>
                <p className="text-xs text-muted-foreground text-right">
                  {headerCards.currentSemester?.label || "لا يوجد فصل حالي"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المعدل التراكمي</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-primary">
                  {headerCards.gpaPercent}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">حالة التسجيل</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-green-600">
                  {headerCards.registrationState}
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  العام الأكاديمي {headerCards.currentSemester?.year || "غير محدد"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Academic details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">الاسم الكامل</p>
                  <p className="text-right">{personalInfo.fullName}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">رقم القيد</p>
                  <p className="text-right font-mono">{personalInfo.rollId}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                  <p className="text-right text-sm">{personalInfo.email}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">التخصص</p>
                  <p className="text-right">{personalInfo.department}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  سجل الدرجات الأكاديمية
                </CardTitle>
                <CardDescription>عرض جميع المواد والدرجات حسب الفصول الدراسية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {academicRecord.map((sem: any, i: number) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold mb-4 text-right">{sem.semester.label}</h3>
                      <div className="space-y-3">
                        {!sem.courses || sem.courses.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-right">
                            لا توجد مواد مسجلة لهذا الفصل.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">المادة</TableHead>
                                <TableHead className="text-right">الرمز</TableHead>
                                <TableHead className="text-right">الساعات</TableHead>
                                <TableHead className="text-right">الدرجة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sem.courses.map((course: any, j: number) => {
                                const gradeLabel =
                                  course.grade === null || course.grade === undefined
                                    ? "غير مسجلة"
                                    : `${course.grade} درجة`;
                                return (
                                  <TableRow key={j}>
                                    <TableCell className="text-right font-medium">{course.title}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {course.code}
                                    </TableCell>
                                    <TableCell className="text-right">{course.credit_hours}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={course.grade === null || course.grade === undefined ? "outline" : "secondary"}>
                                        {gradeLabel}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                الجدول الأسبوعي للمواد
              </CardTitle>
              <CardDescription>عرض جميع المواد لكل أيام الأسبوع (عدا الجمعة).</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <p className="text-sm text-muted-foreground text-right">جارٍ تحميل الجدول...</p>
              ) : scheduleError ? (
                <p className="text-sm text-red-500 text-right">تعذر تحميل الجدول الأسبوعي.</p>
              ) : scheduleData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-right">لا توجد بيانات جدول بعد.</p>
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
                                  {entries.map((entry: any) => (
                                    <div key={entry.id} className="rounded-md border px-2 py-1">
                                      <p className="text-sm font-medium">{entry.subject_title}</p>
                                      <p className="text-xs text-muted-foreground">{entry.subject_code}</p>
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
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
