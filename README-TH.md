# BELLONA Discord Bot Production v3.0

เวอร์ชันนี้จัดโครงสร้างใหม่ให้ตอบไวขึ้น ลด interaction ค้าง และใช้ Firebase Schema ให้ตรงกับเว็บ BELLONA Web v2.3

## ฟังก์ชัน

### ห้อง `✅｜ลงทะเบียนสมาชิกใหม่`
ใช้:
```text
/setup-register-panel
```

ปุ่ม:
- เพิ่มสมาชิก / เพิ่มตัวละคร
- โปรไฟล์ของฉัน

สมัครสมาชิกกรอก:
- UID
- ชื่อตัวละคร
- POWER
- อาชีพจาก Dropdown

### ห้อง `📝｜แจ้งเปลี่ยนชื่อ-อาชีพ`
ใช้:
```text
/setup-change-panel
```

ปุ่ม:
- ขอเปลี่ยนชื่อตัวละคร
- ขอเปลี่ยนอาชีพ
- โปรไฟล์ของฉัน

รองรับ 1 Discord มีหลายตัวละคร

### ห้อง `🛠-admin-bot`
บอทส่งการ์ดคำขอให้ Admin กด:
- อนุมัติ
- ปฏิเสธ

หลังกดแล้วปุ่มจะหาย และการ์ดจะเปลี่ยนสถานะเป็น Approved / Rejected

## Environment Variables

```text
DISCORD_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
REGISTER_CHANNEL_ID
CHANGE_CHANNEL_ID
ADMIN_CHANNEL_ID
MEMBER_ROLE_ID
PORT
```

`GUEST_ROLE_ID` เว้นว่างได้

## Render Secret File

Render > Environment > Secret Files

สร้างไฟล์ JSON ของ Firebase Admin SDK ชื่ออะไรก็ได้ที่ลงท้าย `.json` เช่น:

```text
firebase-admin.json
```

บอทจะค้นหาเองใน `/etc/secrets/*.json`

## Deploy

1. อัปโหลดไฟล์ทั้งหมดทับ GitHub
2. Render > Manual Deploy
3. เลือก Clear build cache & deploy

## Firebase players schema ที่บอทเขียน

```js
{
  absentCount: 0,
  discordDisplayName: "...",
  discordId: "...",
  discordLinked: true,
  discordUsername: "...",
  hasQuota: true,
  id: "timestamp",
  job: "High Wizard",
  lastAttendanceStatus: "",
  lastAttendanceUpdatedAt: "",
  lastAttendanceWarId: "",
  leaveCount: 0,
  name: "BOTTA",
  partyId: null,
  power: "350000",
  powerValue: 350000,
  presentCount: 0,
  rewardClaimed: false,
  rewardName: "",
  slotIndex: null,
  status: "ยังไม่เช็คชื่อ",
  uid: "123456",
  updatedAt: "ISO Date"
}
```

## หมายเหตุ

หลังอัปโหลด v3 แล้วไม่จำเป็นต้องสร้าง Secret File ใหม่ ถ้าของเดิมใช้งานได้อยู่


## v3.0.1 Legacy Panel Fix

แก้ปัญหา `This interaction failed` เมื่อกดปุ่มจาก Panel เก่าที่สร้างก่อนอัปเดต v3

สาเหตุ:
- v3 เปลี่ยน customId ของปุ่มเพื่อจัดโครงสร้างใหม่
- Panel เก่าที่อยู่ใน Discord ยังใช้ customId เดิม
- เมื่อกดปุ่มเก่า บอท v3 ไม่รู้จัก จึงไม่ตอบ interaction

สิ่งที่แก้:
- รองรับปุ่มเก่าและปุ่มใหม่พร้อมกัน
- รองรับ dropdown/modal เก่าบางส่วน
- แนะนำให้สร้าง Panel ใหม่ด้วย `/setup-register-panel` และ `/setup-change-panel` หลัง Deploy


## v3.1 เพิ่มเติม

- ตรวจ UID ซ้ำใน `players` และ `requests` ก่อนส่งคำขอ
- ตรวจชื่อตัวละครซ้ำใน `players` และ `requests` ก่อนส่งคำขอ
- กันคำขอซ้ำของการเปลี่ยนชื่อ/เปลี่ยนอาชีพ ถ้ายังรอ Admin อนุมัติ
- แจ้งผล Approve/Reject กลับผู้ใช้ผ่าน DM
- หลัง Admin กด Approve/Reject การ์ด Admin จะเปลี่ยนสถานะ ลบปุ่ม และลบข้อความอัตโนมัติใน 5 วินาที


## v3.1.1 Stable Rollback

ใช้สำหรับกู้ระบบกลับไปยัง Core ที่ใช้งานได้จริงก่อนเพิ่ม Stability/Auto Recovery

สิ่งที่ทำ:
- ล็อก Node เป็น 20.x
- เอา Auto Recovery / Startup Timeout ออก
- ใช้ Flow เดิมของ Member Module v3.1
- คงระบบสมัครสมาชิก / เปลี่ยนชื่อ / เปลี่ยนอาชีพ / Admin Approve / DM / Duplicate Guard


## v3.1.2 Ready Event Fix

แก้ปัญหา v3.1.1 ไม่ขึ้น Log:
`BELLONA Bot logged in as ...`

สาเหตุ:
- โปรเจกต์ใช้ discord.js v14
- v14 ยังใช้ event `ready`
- v3.1.1 ใช้ `clientReady` ทำให้ callback ไม่ทำงาน

สิ่งที่แก้:
- เปลี่ยนกลับเป็น `client.once('ready', ...)`
- คง Node 20.x
- ไม่แตะระบบสมาชิก / Firebase / Approval
