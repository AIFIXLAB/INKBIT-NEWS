INKBIT NEWS - วิธีอัพขึ้น GitHub / Vercel (มีบอร์ดพูดคุย + หน้าแรงค์)
=====================================================================
ไฟล์ทั้งหมดประมาณ 57 ไฟล์ (อัพทีเดียวได้ ไม่เกิน 100)
  index.html                 หน้าแรก: ข่าว + แผนที่ + รวมคอล + สตอรี่ + ปฏิทิน
  apes / cards / world / pets / zombies / wild / brokers .html   หน้าแต่ละคอล
  rank.html  + rank.js       หน้าแรงค์ (ข้อมูลสดจาก OpenSea + สรุปประจำวัน)
  board.html + board.js      บอร์ดพูดคุย (ตั้งชื่อเล่นแล้วพิมพ์คุยได้)
  backoffice.html + backoffice.js   หลังบ้าน (ไม่มีลิงก์ในเว็บ ต้องใส่รหัสถึงเข้าได้)
  api\  board.js  admin.js  rank.js  _redis.js   ระบบหลังบ้านที่ Vercel รันให้
  style.css  site.js  img\    หน้าตา + ภาพ

ขั้นที่ 1 อัพไฟล์ (ทับของเดิม)
 1) GitHub: ลบของเก่าออก (กดปุ่ม . เปิด github.dev > เลือกทั้งหมด > Delete > Commit & Push)
 2) Add file > Upload files > ลากทุกไฟล์ + โฟลเดอร์ img + โฟลเดอร์ api (ลากทั้งโฟลเดอร์ได้เลย)
 3) Commit changes

ขั้นที่ 2 เปิดที่เก็บข้อความบอร์ด (ฟรี ทำครั้งเดียว)
 1) Vercel > เข้าโปรเจกต์เว็บ > แท็บ Storage > Create Database
 2) เลือก Upstash (Redis / "Upstash for Redis") > แพลนฟรี > Create
 3) กด Connect to Project เลือกโปรเจกต์เว็บนี้ (Vercel จะใส่ค่าเชื่อมต่อให้เอง)

ขั้นที่ 3 ตั้งรหัสหลังบ้าน + คีย์ OpenSea (ห้ามเขียนลงไฟล์ ให้ใส่ใน Vercel เท่านั้น)
 Vercel > โปรเจกต์ > Settings > Environment Variables > Add
   ADMIN_KEY        = รหัสยาวๆ ที่คุณตั้งเอง อย่างน้อย 8 ตัว (ใช้เข้าหลังบ้าน)
   OPENSEA_API_KEY  = คีย์ API ของ OpenSea (ขอได้ที่หน้า Developer ของ OpenSea)
 แล้วไปแท็บ Deployments > กด ... ที่อันล่าสุด > Redeploy

การใช้งานหลังบ้าน
 - เข้า  https://<เว็บคุณ>/backoffice.html  > ใส่ ADMIN_KEY > Open
 - เห็นรายการวันทั้งหมด กด View ดูข้อความ หรือ Download .txt ได้ไฟล์รายวัน
   ชื่อไฟล์ inkbit-board-YYYY-MM-DD.txt (เวลาไทย) หรือกด Download every day รวมทุกวัน
 - ข้อความทุกอันถูกบันทึกเข้าไฟล์รายวันอัตโนมัติ แม้จะลบออกจากหน้าบอร์ดแล้วก็ยังมีในบันทึก
 - กด Remove เพื่อลบข้อความ scam / ไม่สุภาพ ออกจากหน้าบอร์ด
 - เอาไฟล์ .txt มาวางคุยกับ Claude ได้เลย เพื่อสรุปไอเดียและจัดกิจกรรม

ระบบกันสแปมในบอร์ด
 - ห้ามใส่ลิงก์ (กันลิงก์หลอก) / ตั้งชื่อว่า admin, official, inkbit, mod, support ไม่ได้ (กันแอบอ้าง)
 - โพสต์ได้ 1 ข้อความทุก ~8 วินาที / ยาวไม่เกิน 400 ตัวอักษร
 - ไม่เก็บ IP จริง เก็บแค่รหัสย่อ (#xxxxxx) ไว้ดูว่าใครโพสต์ซ้ำ

หน้าแรงค์
 - มีคีย์ OpenSea: แสดงข้อมูลสด (floor, volume 24h, เจ้าของ, ขายแพงสุด, ผู้ซื้ออันดับ 1 ของแต่ละคอล) อัปเดตทุก 10 นาที
 - ยังไม่มีคีย์: แสดง "Today's snapshot" ที่ Claude สรุปให้แทน

แก้ลิงก์ / วันมิ้นท์: เปิด site.js บรรทัดบนสุดคือ LINKS และ DROPS
