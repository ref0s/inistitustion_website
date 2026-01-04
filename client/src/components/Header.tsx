import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, User, LogOut } from "lucide-react";
import Logo from "@/assets/image-removebg-preview.png";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useStudentAuth } from "@/context/StudentAuthContext";
const Header = () => {
  const navigate = useNavigate();
  const { authHeader, logout: adminLogout } = useAdminAuth();
  const { studentData, clearStudentData } = useStudentAuth();

  const isAdmin = !!authHeader;
  const isStudent = !!studentData;

  const handleLogout = () => {
    if (isAdmin) adminLogout();
    if (isStudent) clearStudentData();
    navigate("/login");
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* شعار المعهد */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg">
              <img src={Logo} className="w-10 h-10" alt="شعار المعهد" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">المعهد العالي للعلوم والتقنية العربان</h1>
            </div>
          </Link>

          {/* قائمة التنقل */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/#hero"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              الرئيسية
            </a>
            <a
              href="/#deps"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              الأقسام
            </a>
            <a
              href="/#contact"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              تواصل معنا
            </a>
          </nav>

          {/* CTA */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate("/admin")} className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">لوحة الإدارة</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          ) : isStudent ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">لوحة الطالب</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => navigate("/login")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
