import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Key } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useAdminAuth } from "@/context/AdminAuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

const getErrorMessage = (err: any, fallback: string) => {
  const apiMsg = err?.response?.data?.error;
  return apiMsg || err?.message || fallback;
};

const Login = () => {
  const [loginMode, setLoginMode] = useState<"student" | "admin">("student");
  const [formData, setFormData] = useState({ email: "", studentId: "", password: "" });
  const [adminData, setAdminData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setStudentData, clearStudentData } = useStudentAuth();
  const { setCredentials } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginMode === "admin") {
        const header = `Basic ${btoa(`${adminData.username}:${adminData.password}`)}`;
        await axios.get(`${API_BASE}/api/admin/me`, { headers: { Authorization: header } });
        clearStudentData();
        setCredentials({ username: adminData.username, password: adminData.password });
        toast.success("تم تسجيل دخول الإدارة بنجاح ✅");
        navigate("/admin");
        return;
      }

      // Student login: POST /api/student-dashboard
      const { data } = await axios.post(`${API_BASE}/api/student-dashboard`, {
        email: formData.email,
        rollId: formData.studentId,
        password: formData.password,
      });

      setCredentials(null);
      setStudentData(data);
      // success → go to dashboard with data in route state
      toast.success("تم تسجيل الدخول بنجاح ✅");
      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = getErrorMessage(err, "حدث خطأ أثناء تسجيل الدخول");
      if (status === 401 || status === 404) {
        toast.error(msg || "❌ البيانات غير صحيحة");
      } else {
        toast.error(msg);
      }
      console.error("login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdminData((s) => ({ ...s, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {loginMode === "admin" ? "تسجيل دخول الإدارة" : "تسجيل دخول الطلاب"}
              </CardTitle>
              <CardDescription>ادخل بياناتك للوصول إلى النظام الأكاديمي</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as "student" | "admin")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="student">طالب</TabsTrigger>
                  <TabsTrigger value="admin">إدارة</TabsTrigger>
                </TabsList>
              </Tabs>
              <form onSubmit={handleSubmit} className="space-y-6">
                {loginMode === "admin" ? (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> اسم المستخدم
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="admin"
                      value={adminData.username}
                      onChange={handleAdminChange}
                      required
                      className="text-right"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" /> رقم القيد
                      </Label>
                      <Input
                        id="studentId"
                        name="studentId"
                        type="text"
                        placeholder="202312345"
                        value={formData.studentId}
                        onChange={handleChange}
                        required
                        className="text-right"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginMode === "admin" ? adminData.password : formData.password}
                    onChange={loginMode === "admin" ? handleAdminChange : handleChange}
                    required
                    className="text-right"
                  />
                </div>

                <Button type="submit" className="w-full py-6 text-base font-medium" disabled={loading}>
                  {loading ? "جارٍ الدخول..." : loginMode === "admin" ? "دخول الإدارة" : "تسجيل الدخول"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    هل نسيت كلمة المرور؟{" "}
                    <a href="#" className="text-primary hover:underline font-medium">اتصل بالإدارة</a>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
