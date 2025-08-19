import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Key } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", studentId: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Your backend route from App.jsx: POST /api/student-dashboard
      const { data } = await axios.post(`${API_BASE}/api/student-dashboard`, {
        email: formData.email,
        rollId: formData.studentId,
        password: formData.password,
      });

      // success → go to dashboard with data in route state
      toast.success("تم تسجيل الدخول بنجاح ✅");
      navigate("/dashboard", { state: { studentData: data } });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 404) {
        toast.error("❌ البيانات غير صحيحة");
      } else {
        toast.error("حدث خطأ أثناء تسجيل الدخول");
      }
      console.error("login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

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
              <CardTitle className="text-2xl font-bold">تسجيل دخول الطلاب</CardTitle>
              <CardDescription>ادخل بياناتك للوصول إلى النظام الأكاديمي</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> البريد الإلكتروني
                  </Label>
                  <Input id="email" name="email" type="email" placeholder="student@example.com"
                         value={formData.email} onChange={handleChange} required className="text-right" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> رقم القيد
                  </Label>
                  <Input id="studentId" name="studentId" type="text" placeholder="202312345"
                         value={formData.studentId} onChange={handleChange} required className="text-right" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> كلمة المرور
                  </Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••"
                         value={formData.password} onChange={handleChange} required className="text-right" />
                </div>

                <Button type="submit" className="w-full py-6 text-base font-medium" disabled={loading}>
                  {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
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
