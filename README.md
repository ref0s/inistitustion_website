# دليل التشغيل والاستخدام

## تنزيل المشروع
```bash
git clone https://github.com/ref0s/inistitustion_website.git
cd inistitustion_website
```

## المتطلبات المسبقة
- Node.js (الإصدار 18 أو أحدث)
- npm (يأتي مع Node.js)

## إعداد الخادم
1) الانتقال إلى مجلد الخادم:
```bash
cd server
```

2) إنشاء ملف `.env` بالمحتوى التالي:
```env
HOST=localhost
DB_PORT=5432
DATABASE=inistitustion
DB_USER=postgres
PASSWORD=0000
PORT=5050
SQLITE_FILE=./data/app.db
```

ملاحظة: النظام يعتمد حالياً على SQLite ويستخدم `SQLITE_FILE`.

3) تثبيت الاعتماديات:
```bash
npm install
```

4) إنشاء قاعدة البيانات:
```bash
node migrations/init.js
```

5) تشغيل الخادم:
```bash
npm start
```

رسالة النجاح المتوقعة:
- Connected to SQLite: server/data/app.db
- Server running on 5050

## إعداد الواجهة
1) الانتقال إلى مجلد الواجهة:
```bash
cd ../client
```

2) تثبيت الاعتماديات:
```bash
npm install
```

3) (اختياري) تحديد عنوان الخادم:
```env
VITE_API_URL=http://localhost:5050
```

4) تشغيل الواجهة:
```bash
npm run dev
```

الواجهة تعمل عادة على `http://localhost:5173`.

## استخدام النظام
1) تسجيل دخول الإدارة:
   - اذهب إلى `/login`.
   - اختر تبويب الإدارة.
   - بيانات الدخول: اسم المستخدم `admin` وكلمة المرور `admin`.
   - ستنتقل إلى لوحة الإدارة على `/admin/data`.

2) إضافة طالب:
   - من لوحة الإدارة أضف طالباً جديداً من قسم الطلاب.

3) تسجيل دخول الطالب:
   - ارجع إلى `/login`.
   - اختر تبويب الطالب.
   - استخدم بيانات الطالب التي أضافها المشرف.
   - ستنتقل إلى لوحة الطالب على `/dashboard`.
