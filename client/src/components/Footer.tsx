import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const departments = [
  "قسم التقنيات الكربائية و الالكترونية (شعبة انظمة القدرة)",
  "قسم المختبرات الطبية",
  "قسم التمريض العام",
  "قسم الحاسب الالي (شعبة تقنية المعلومات)",
  "قسم ادارة الاعمال",
  "قسم الصيدلية",
  "قسم العلاج الطبيعي",
];

const Footer = () => {
  return (
    <footer className="bg-muted mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* معلومات المعهد */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">المعهد التقني</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              نقدم أفضل التخصصات التقنية والبرامج التدريبية لإعداد جيل متميز من الخريجين المؤهلين لسوق العمل.
            </p>
          </div>

          {/* روابط سريعة */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-muted-foreground hover:text-primary transition-colors">الرئيسية</a></li>
              <li><a href="/departments" className="text-muted-foreground hover:text-primary transition-colors">الأقسام</a></li>
              <li><a href="/news" className="text-muted-foreground hover:text-primary transition-colors">الأخبار</a></li>
              <li><a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">تواصل معنا</a></li>
            </ul>
          </div>

          {/* الأقسام */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">الأقسام الدراسية</h3>
            <ul className="space-y-2 text-sm">
              {departments.map((dept) => (
                <li key={dept} className="text-muted-foreground">
                  {dept}
                </li>
              ))}
            </ul>
          </div>

          {/* بيانات التواصل */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">تواصل معنا</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+218 21 1234567</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@techinstitute.edu.ly</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>ترهونة، ليبيا</span>
              </div>
            </div>
            
            {/* وسائل التواصل الاجتماعي */}
            <div className="flex gap-3 pt-4">
              <a href="#" className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                <Facebook className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                <Twitter className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                <Instagram className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
