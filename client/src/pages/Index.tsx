import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Code,
  Shield,
  Brain,
  Database,
  GraduationCap,
  BookOpen,
  Award,
  Users
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import instituteHero from "@/assets/institute-hero.jpg";
import Logo from "@/assets/image-removebg-preview.png";
const Index = () => {
  const departments = [
    {
      name: "قسم التقنيات الكربائية و الالكترونية (شعبة انظمة القدرة)",
      description: "تأهيل كوادر في أنظمة القدرة والشبكات الكهربائية.",
      icon: Award,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم المختبرات الطبية",
      description: "تحليل العينات المخبرية وتشخيص الأمراض بدقة.",
      icon: BookOpen,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم التمريض العام",
      description: "رعاية صحية وتمريضية وفق المعايير المهنية.",
      icon: GraduationCap,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم الحاسب الالي (شعبة تقنية المعلومات)",
      description: "إدارة الشبكات والأنظمة وتطوير الحلول التقنية.",
      icon: Code,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم ادارة الاعمال",
      description: "إدارة الموارد والتخطيط والتسويق للمؤسسات.",
      icon: Users,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم الصيدلية",
      description: "العلوم الدوائية وصرف الأدوية بأمان.",
      icon: Shield,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    },
    {
      name: "قسم العلاج الطبيعي",
      description: "العلاج الحركي وإعادة التأهيل للمرضى.",
      icon: Brain,
      duration: "حسب الخطة",
      students: "متاح للتسجيل"
    }
  ];

  const news = [
    {
      title: "بدء التسجيل للفصل الدراسي الجديد",
      date: "2024-01-15",
      description: "فتح باب التسجيل للطلاب الجدد في جميع التخصصات"
    },
    {
      title: "معرض مشاريع التخرج 2024",
      date: "2024-01-10",
      description: "عرض أفضل مشاريع الطلاب في معرض التقنية السنوي"
    },
    {
      title: "ورشة عمل في الذكاء الاصطناعي",
      date: "2024-01-05",
      description: "ورشة تدريبية مجانية للطلاب والمهتمين"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* القسم الرئيسي */}
      <section id="hero" className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${instituteHero})` }}
        >
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
           المعهد العالي للعلوم والتقنية العربان
          </h1>
          <p className="text-xl md:text-2xl mb-8 leading-relaxed">
            نقدم أفضل التخصصات التقنية لإعداد جيل متميز من الخريجين المؤهلين لسوق العمل
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#deps">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                تصفح الأقسام
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </a>
            <a href="#contact">

            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-black hover:bg-white hover:text-primary">
              تواصل معنا
            </Button>
            </a>
          </div>
        </div>
      </section>

      {/* الأقسام الدراسية */}
      <section id='deps' className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">الأقسام الدراسية</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تخصصات متقدمة تواكب احتياجات سوق العمل وتقنيات المستقبل
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {departments.map((dept, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                    <dept.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {dept.description}
                  </CardDescription>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      مدة الدراسة: {dept.duration}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {dept.students}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* رؤيتنا */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">رؤيتنا</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              نؤمن أن الطالب يستحق رحلة دراسية واضحة ومحترمة، وأن المؤسسة تستحق أدوات تنظيم تجعل العمل أسهل والنتائج أفضل.
              رؤيتنا هي جعل البيئة الأكاديمية أكثر اتساقًا واستقرارًا للجميع.
            </p>
          </div>
        </div>
      </section>

      {/* بيانات التواصل */}
      <section id='contact' className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">تواصل معنا</h2>
            <p className="text-xl text-muted-foreground">
              نحن هنا للإجابة على جميع استفساراتك
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-2 text-primary text-lg font-semibold">
                <Phone className="h-5 w-5" />
                <span>اتصل بنا</span>
              </div>
              <p className="text-muted-foreground">+218 21 1234567</p>
              <p className="text-muted-foreground">+218 21 1234568</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center items-center gap-2 text-primary text-lg font-semibold">
                <Mail className="h-5 w-5" />
                <span>راسلنا</span>
              </div>
              <p className="text-muted-foreground">info@techinstitute.edu.ly</p>
              <p className="text-muted-foreground">admin@techinstitute.edu.ly</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center items-center gap-2 text-primary text-lg font-semibold">
                <MapPin className="h-5 w-5" />
                <span>زورونا</span>
              </div>
              <p className="text-muted-foreground">ترهونة</p>
              <p className="text-muted-foreground">ليبيا</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
