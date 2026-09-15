# NOVA ACADEMY

Premium IT Academy platform: public landing page + admission wizard + Supabase CRM.

## Ishga tushirish

```bash
npm install
cp .env.example .env.local
```

`.env.local` ichiga Supabase project URL va anon key kiriting:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase SQL Editor'da `supabase/schema.sql` ni ishga tushiring.

Keyin:

```bash
npm run dev
```

`http://localhost:3000`

Admin:
`http://localhost:3000/admin`

Admin userni Supabase Authentication orqali yarating.

## Muhim security

`service_role` key frontendga qo‘yilmaydi. Browser faqat public anon key ishlatadi.

`supabase/schema.sql` public ariza yuborishni va authenticated CRM amallarini RLS orqali ajratadi. Production'da authenticated userlarni alohida `admin_profiles`/role jadvali bilan faqat adminlarga cheklash tavsiya etiladi.

## Production

Vercel'ga deploy qiling va environment variables kiriting. Domain, real social links, haqiqiy student natijalari va real course duration kabi ma'lumotlar mavjud bo‘lsa, ularni alohida kontent/config sifatida kiriting.
