import { useLocation, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, GraduationCap, BookOpen, Calendar, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const StudentDashboard = () => {
  const location = useLocation();
  const studentData = (location.state as any)?.studentData;

  if (!studentData) {
    // direct visit to /dashboard without login → send back
    return <Navigate to="/login" replace />;
  }

  const { headerCards, personalInfo, academicRecord } = studentData;

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
                        {sem.courses?.map((course: any, j: number) => (
                          <div key={j} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="text-l text-muted-foreground">
                                {course.grade} درجة • {course.credit_hours} ساعات
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground">{course.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
