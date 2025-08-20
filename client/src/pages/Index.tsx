import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Code,
  Shield,
  Brain,
  Database
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import instituteHero from "@/assets/institute-hero.jpg";
import Logo from "@/assets/image-removebg-preview.png";
const Index = () => {
  const departments = [
    {
      name: "هندسة البرمجيات",
      description: "تطوير التطبيقات والأنظمة البرمجية الحديثة",
      icon: Code,
      duration: "4 سنوات",
      students: "120 طالب"
    },
    {
      name: "تقنية المعلومات",
      description: "إدارة وصيانة الأنظمة والشبكات",
      icon: Database,
      duration: "4 سنوات",
      students: "95 طالب"
    },
    {
      name: "الأمن السيبراني",
      description: "حماية البيانات والأنظمة من التهديدات",
      icon: Shield,
      duration: "4 سنوات",
      students: "85 طالب"
    },
    {
      name: "الذكاء الاصطناعي",
      description: "تقنيات التعلم الآلي والذكاء الاصطناعي",
      icon: Brain,
      duration: "4 سنوات",
      students: "70 طالب"
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

  const stats = [
    { label: "طالب مسجل", value: "370+", icon: Users },
    { label: "برنامج دراسي", value: "4", icon: BookOpen },
    { label: "عضو هيئة تدريس", value: "45", icon: GraduationCap },
    { label: "خريج متميز", value: "850+", icon: Award }
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* القسم الرئيسي */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
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

            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary">
              تواصل معنا
            </Button>
            </a>
          </div>
        </div>
      </section>

      {/* إحصائيات المعهد */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
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

      {/* آخر الأخبار والإعلانات */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">آخر الأخبار</h2>
            <p className="text-xl text-muted-foreground">
              تابع آخر الأخبار والفعاليات في المعهد
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.date).toLocaleDateString('ar-SA')}
                  </div>
                  <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                  <Button variant="ghost" className="mt-4 p-0 h-auto text-primary hover:text-primary-dark">
                    اقرأ المزيد
                    <ArrowRight className="mr-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">اتصل بنا</h3>
              <p className="text-muted-foreground">+966 11 1234567</p>
              <p className="text-muted-foreground">+966 11 1234568</p>
            </Card>
            
            <Card className="text-center p-8">
              <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">راسلنا</h3>
              <p className="text-muted-foreground">info@techinstitute.edu.sa</p>
              <p className="text-muted-foreground">admin@techinstitute.edu.sa</p>
            </Card>
            
            <Card className="text-center p-8">
              <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">زوروا</h3>
              <p className="text-muted-foreground">الرياض، حي النخيل</p>
              <p className="text-muted-foreground">المملكة العربية السعودية</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
