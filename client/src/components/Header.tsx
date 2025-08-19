import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, User } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* شعار المعهد */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">المعهد التقني</h1>
              <p className="text-sm text-muted-foreground">للتعليم والتدريب</p>
            </div>
          </Link>

          {/* قائمة التنقل */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              الرئيسية
            </Link>
            <Link 
              to="/departments" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              الأقسام
            </Link>
            <Link 
              to="/news" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              الأخبار
            </Link>
            <Link 
              to="/contact" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              تواصل معنا
            </Link>
          </nav>

          {/* زر تسجيل الدخول */}
          <Button 
            onClick={() => navigate("/login")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل الدخول</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;