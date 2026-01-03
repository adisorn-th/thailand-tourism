"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Map, MapPin, Navigation, ArrowLeft, Search, Info, Camera, Compass, X, ZoomIn, ZoomOut, Maximize, ChevronRight } from 'lucide-react';

// --- INTERFACES & TYPES ---

interface Province {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
}

interface Region {
  id: string;
  name: string;
  color: string;
  text: string;
  fill: string;
  stroke: string;
}

interface District {
  id: string;
  name: string;
}

interface TransformState {
  x: number;
  y: number;
  k: number;
}

// --- DATA CONSTANTS ---

// ข้อมูลพิกัด 77 จังหวัด (Approximate Coordinates on 350x650 SVG)
const ALL_PROVINCES: Province[] = [
  // --- ภาคเหนือ (9) ---
  { id: 'chiangrai', name: 'เชียงราย', region: 'north', x: 140, y: 40 },
  { id: 'chiangmai', name: 'เชียงใหม่', region: 'north', x: 100, y: 70 },
  { id: 'maehongson', name: 'แม่ฮ่องสอน', region: 'north', x: 70, y: 60 },
  { id: 'phayao', name: 'พะเยา', region: 'north', x: 160, y: 65 },
  { id: 'nan', name: 'น่าน', region: 'north', x: 190, y: 80 },
  { id: 'lampang', name: 'ลำปาง', region: 'north', x: 130, y: 90 },
  { id: 'lamphun', name: 'ลำพูน', region: 'north', x: 110, y: 85 },
  { id: 'phrae', name: 'แพร่', region: 'north', x: 160, y: 100 },
  { id: 'uttaradit', name: 'อุตรดิตถ์', region: 'north', x: 155, y: 125 },

  // --- ภาคตะวันออกเฉียงเหนือ (20) ---
  { id: 'loei', name: 'เลย', region: 'northeast', x: 170, y: 140 },
  { id: 'nongkhai', name: 'หนองคาย', region: 'northeast', x: 210, y: 120 },
  { id: 'buengkan', name: 'บึงกาฬ', region: 'northeast', x: 240, y: 125 },
  { id: 'nongbualamphu', name: 'หนองบัวลำภู', region: 'northeast', x: 200, y: 150 },
  { id: 'udonthani', name: 'อุดรธานี', region: 'northeast', x: 215, y: 145 },
  { id: 'sakonreakhon', name: 'สกลนคร', region: 'northeast', x: 250, y: 150 },
  { id: 'nakhonphanom', name: 'นครพนม', region: 'northeast', x: 270, y: 155 },
  { id: 'khonkaen', name: 'ขอนแก่น', region: 'northeast', x: 220, y: 180 },
  { id: 'kalasin', name: 'กาฬสินธุ์', region: 'northeast', x: 240, y: 180 },
  { id: 'mukdahan', name: 'มุกดาหาร', region: 'northeast', x: 270, y: 190 },
  { id: 'mahasarakham', name: 'มหาสารคาม', region: 'northeast', x: 230, y: 200 },
  { id: 'roiet', name: 'ร้อยเอ็ด', region: 'northeast', x: 250, y: 205 },
  { id: 'yasothon', name: 'ยโสธร', region: 'northeast', x: 270, y: 215 },
  { id: 'amnatcharoen', name: 'อำนาจเจริญ', region: 'northeast', x: 285, y: 220 },
  { id: 'chaiyaphum', name: 'ชัยภูมิ', region: 'northeast', x: 190, y: 200 },
  { id: 'nakhonratchasima', name: 'นครราชสีมา', region: 'northeast', x: 190, y: 240 },
  { id: 'buriram', name: 'บุรีรัมย์', region: 'northeast', x: 230, y: 250 },
  { id: 'surin', name: 'สุรินทร์', region: 'northeast', x: 250, y: 260 },
  { id: 'sisaket', name: 'ศรีสะเกษ', region: 'northeast', x: 270, y: 260 },
  { id: 'ubonratchathani', name: 'อุบลราชธานี', region: 'northeast', x: 295, y: 250 },

  // --- ภาคกลาง (22 - รวม กทม) ---
  { id: 'sukhothai', name: 'สุโขทัย', region: 'central', x: 130, y: 145 },
  { id: 'phitsanulok', name: 'พิษณุโลก', region: 'central', x: 150, y: 155 },
  { id: 'kamphaengphet', name: 'กำแพงเพชร', region: 'central', x: 115, y: 170 },
  { id: 'phichit', name: 'พิจิตร', region: 'central', x: 140, y: 180 },
  { id: 'phetchabun', name: 'เพชรบูรณ์', region: 'central', x: 165, y: 180 },
  { id: 'nakhonsawan', name: 'นครสวรรค์', region: 'central', x: 140, y: 205 },
  { id: 'uthaitani', name: 'อุทัยธานี', region: 'central', x: 120, y: 215 },
  { id: 'chainat', name: 'ชัยนาท', region: 'central', x: 140, y: 225 },
  { id: 'singburi', name: 'สิงห์บุรี', region: 'central', x: 145, y: 235 },
  { id: 'lopburi', name: 'ลพบุรี', region: 'central', x: 160, y: 235 },
  { id: 'angthong', name: 'อ่างทอง', region: 'central', x: 145, y: 245 },
  { id: 'saraburi', name: 'สระบุรี', region: 'central', x: 165, y: 250 },
  { id: 'ayutthaya', name: 'อยุธยา', region: 'central', x: 150, y: 255 },
  { id: 'pathumthani', name: 'ปทุมธานี', region: 'central', x: 150, y: 265 },
  { id: 'nonthaburi', name: 'นนทบุรี', region: 'central', x: 145, y: 270 },
  { id: 'bangkok', name: 'กรุงเทพฯ', region: 'central', x: 152, y: 275 },
  { id: 'samutprakan', name: 'สมุทรปราการ', region: 'central', x: 160, y: 280 },
  { id: 'nakhonnayok', name: 'นครนายก', region: 'central', x: 175, y: 260 },
  { id: 'samutsakhon', name: 'สมุทรสาคร', region: 'central', x: 140, y: 280 },
  { id: 'samutsongkhram', name: 'สมุทรสงคราม', region: 'central', x: 130, y: 285 },
  { id: 'nakhonpathom', name: 'นครปฐม', region: 'central', x: 135, y: 270 },
  { id: 'suphanburi', name: 'สุพรรณบุรี', region: 'central', x: 130, y: 250 },

  // --- ภาคตะวันออก (7) ---
  { id: 'prachinburi', name: 'ปราจีนบุรี', region: 'east', x: 190, y: 270 },
  { id: 'sakaeo', name: 'สระแก้ว', region: 'east', x: 215, y: 275 },
  { id: 'chachoengsao', name: 'ฉะเชิงเทรา', region: 'east', x: 180, y: 280 },
  { id: 'chonburi', name: 'ชลบุรี', region: 'east', x: 180, y: 295 },
  { id: 'rayong', name: 'ระยอง', region: 'east', x: 190, y: 315 },
  { id: 'chanthaburi', name: 'จันทบุรี', region: 'east', x: 210, y: 325 },
  { id: 'trat', name: 'ตราด', region: 'east', x: 230, y: 350 },

  // --- ภาคตะวันตก (5) ---
  { id: 'tak', name: 'ตาก', region: 'west', x: 90, y: 160 },
  { id: 'kanchanaburi', name: 'กาญจนบุรี', region: 'west', x: 95, y: 240 },
  { id: 'ratchaburi', name: 'ราชบุรี', region: 'west', x: 115, y: 280 },
  { id: 'phetchaburi', name: 'เพชรบุรี', region: 'west', x: 115, y: 305 },
  { id: 'prachuapkhirikhan', name: 'ประจวบคีรีขันธ์', region: 'west', x: 115, y: 360 },

  // --- ภาคใต้ (14) ---
  { id: 'chumphon', name: 'ชุมพร', region: 'south', x: 110, y: 410 },
  { id: 'ranong', name: 'ระนอง', region: 'south', x: 90, y: 430 },
  { id: 'suratthani', name: 'สุราษฎร์ธานี', region: 'south', x: 110, y: 460 },
  { id: 'phangnga', name: 'พังงา', region: 'south', x: 90, y: 470 },
  { id: 'phuket', name: 'ภูเก็ต', region: 'south', x: 80, y: 490 },
  { id: 'krabi', name: 'กระบี่', region: 'south', x: 100, y: 495 },
  { id: 'nakhonsithammarat', name: 'นครศรีธรรมราช', region: 'south', x: 120, y: 500 },
  { id: 'trang', name: 'ตรัง', region: 'south', x: 105, y: 525 },
  { id: 'phatthalung', name: 'พัทลุง', region: 'south', x: 120, y: 530 },
  { id: 'satun', name: 'สตูล', region: 'south', x: 110, y: 550 },
  { id: 'songkhla', name: 'สงขลา', region: 'south', x: 135, y: 550 },
  { id: 'pattani', name: 'ปัตตานี', region: 'south', x: 150, y: 565 },
  { id: 'yala', name: 'ยะลา', region: 'south', x: 145, y: 590 },
  { id: 'narathiwat', name: 'นราธิวาส', region: 'south', x: 165, y: 585 },
];

const PLACES_DATA: { regions: Region[] } = {
  regions: [
    { id: 'north', name: 'ภาคเหนือ', color: 'bg-emerald-500', text: 'text-emerald-600', fill: 'fill-emerald-400', stroke: 'stroke-emerald-300' },
    { id: 'northeast', name: 'ภาคตะวันออกเฉียงเหนือ', color: 'bg-orange-500', text: 'text-orange-600', fill: 'fill-orange-400', stroke: 'stroke-orange-300' },
    { id: 'central', name: 'ภาคกลาง', color: 'bg-yellow-500', text: 'text-yellow-600', fill: 'fill-yellow-400', stroke: 'stroke-yellow-300' },
    { id: 'east', name: 'ภาคตะวันออก', color: 'bg-blue-400', text: 'text-blue-600', fill: 'fill-blue-400', stroke: 'stroke-blue-300' },
    { id: 'west', name: 'ภาคตะวันตก', color: 'bg-amber-600', text: 'text-amber-600', fill: 'fill-amber-400', stroke: 'stroke-amber-300' },
    { id: 'south', name: 'ภาคใต้', color: 'bg-cyan-500', text: 'text-cyan-600', fill: 'fill-cyan-400', stroke: 'stroke-cyan-300' },
  ]
};

const MOCK_DISTRICTS: Record<string, string[]> = {
  //const thailandDistricts = {
  // --- ภาคเหนือ (9 จังหวัด) ---
  'chiangmai': [
    'เมืองเชียงใหม่', 'จอมทอง', 'แม่แจ่ม', 'เชียงดาว', 'ดอยสะเก็ด', 'แม่แตง', 'แม่ริม', 'สะเมิง', 'ฝาง', 'แม่อาย', 
    'พร้าว', 'สันป่าตอง', 'สันกำแพง', 'สันทราย', 'หางดง', 'ฮอด', 'ดอยเต่า', 'อมก๋อย', 'สารภี', 'เวียงแหง', 
    'ไชยปราการ', 'แม่วาง', 'แม่ออน', 'ดอยหล่อ', 'กัลยาณิวัฒนา'
  ],
  'chiangrai': [
    'เมืองเชียงราย', 'เวียงชัย', 'เชียงของ', 'เทิง', 'พาน', 'ป่าแดด', 'แม่จัน', 'เชียงแสน', 'แม่สาย', 'แม่สรวย', 
    'เวียงป่าเป้า', 'พญาเม็งราย', 'เวียงแก่น', 'ขุนตาล', 'แม่ฟ้าหลวง', 'แม่ลาว', 'เวียงเชียงรุ้ง', 'ดอยหลวง'
  ],
  'lampang': [
    'เมืองลำปาง', 'แม่เมาะ', 'เกาะคา', 'เสริมงาม', 'งาว', 'แจ้ห่ม', 'วังเหนือ', 'เถิน', 'แม่พริก', 'แม่ทะ', 
    'สบปราบ', 'ห้างฉัตร', 'เมืองปาน'
  ],
  'lamphun': [
    'เมืองลำพูน', 'แม่ทา', 'บ้านโฮ่ง', 'ลี้', 'ทุ่งหัวช้าง', 'ป่าซาง', 'บ้านธิ', 'เวียงหนองล่อง'
  ],
  'maehongson': [
    'เมืองแม่ฮ่องสอน', 'ขุนยวม', 'ปาย', 'แม่สะเรียง', 'แม่ลาน้อย', 'สบเมย', 'ปางมะผ้า'
  ],
  'nan': [
    'เมืองน่าน', 'แม่จริม', 'บ้านหลวง', 'นาน้อย', 'ปัว', 'ท่าวังผา', 'เวียงสา', 'ทุ่งช้าง', 'เชียงกลาง', 'นาหมื่น', 
    'สันติสุข', 'บ่อเกลือ', 'สองแคว', 'ภูเพียง', 'เฉลิมพระเกียรติ'
  ],
  'phayao': [
    'เมืองพะเยา', 'จุน', 'เชียงคำ', 'เชียงม่วน', 'ดอกคำใต้', 'ปง', 'แม่ใจ', 'ภูซาง', 'ภูกามยาว'
  ],
  'phrae': [
    'เมืองแพร่', 'ร้องกวาง', 'ลอง', 'สูงเม่น', 'เด่นชัย', 'สอง', 'วังชิ้น', 'หนองม่วงไข่'
  ],
  'uttaradit': [
    'เมืองอุตรดิตถ์', 'ตรอน', 'ท่าปลา', 'น้ำปาด', 'ฟากท่า', 'บ้านโคก', 'พิชัย', 'ลับแล', 'ทองแสนขัน'
  ],

  // --- ภาคตะวันออกเฉียงเหนือ (20 จังหวัด) ---
  'kalasin': [
    'เมืองกาฬสินธุ์', 'นามน', 'กมลาไสย', 'ร่องคำ', 'กุฉินารายณ์', 'เขาวง', 'ยางตลาด', 'ห้วยเม็ก', 'สหัสขันธ์', 
    'คำม่วง', 'ท่าคันโท', 'หนองกุงศรี', 'สมเด็จ', 'ห้วยผึ้ง', 'สามชัย', 'นาคู', 'ดอนจาน', 'ฆ้องชัย'
  ],
  'khonkaen': [
    'เมืองขอนแก่น', 'บ้านฝาง', 'พระยืน', 'หนองเรือ', 'ชุมแพ', 'สีชมพู', 'น้ำพอง', 'อุบลรัตน์', 'กระนวน', 
    'บ้านไผ่', 'เปือยน้อย', 'พล', 'แวงใหญ่', 'แวงน้อย', 'หนองสองห้อง', 'ภูเวียง', 'มัญจาคีรี', 'ชนบท', 
    'เขาสวนกวาง', 'ภูผาม่าน', 'ซำสูง', 'โคกโพธิ์ไชย', 'หนองนาคำ', 'บ้านแฮด', 'โนนศิลา', 'เวียงเก่า'
  ],
  'chaiyaphum': [
    'เมืองชัยภูมิ', 'บ้านเขว้า', 'คอนสวรรค์', 'เกษตรสมบูรณ์', 'หนองบัวแดง', 'จัตุรัส', 'บำเหน็จณรงค์', 'หนองบัวระเหว', 
    'เทพสถิต', 'ภูเขียว', 'บ้านแท่น', 'แก้งคร้อ', 'คอนสาร', 'ภักดีชุมพล', 'เนินสง่า', 'ซับใหญ่'
  ],
  'nakhonphanom': [
    'เมืองนครพนม', 'ปลาปาก', 'ท่าอุเทน', 'บ้านแพง', 'ธาตุพนม', 'เรณูนคร', 'นาแก', 'ศรีสงคราม', 'นาหว้า', 
    'โพนสวรรค์', 'นาทม', 'วังยาง'
  ],
  'nakhonratchasima': [
    'เมืองนครราชสีมา', 'ครบุรี', 'เสิงสาง', 'คง', 'บ้านเหลื่อม', 'จักราช', 'โชคชัย', 'ด่านขุนทด', 'โนนไทย', 
    'โนนสูง', 'ขามสะแกแสง', 'บัวใหญ่', 'ประทาย', 'ปักธงชัย', 'พิมาย', 'ห้วยแถลง', 'ชุมพวง', 'สูงเนิน', 
    'ขามทะเลสอ', 'สีคิ้ว', 'ปากช่อง', 'หนองบุญมาก', 'แก้งสนามนาง', 'โนนแดง', 'วังน้ำเขียว', 'เทพารักษ์', 
    'เมืองยาง', 'พระทองคำ', 'ลำทะเมนชัย', 'บัวลาย', 'สีดา', 'เฉลิมพระเกียรติ'
  ],
  'buengkan': [
    'เมืองบึงกาฬ', 'พรเจริญ', 'โซ่พิสัย', 'เซกา', 'ปากคาด', 'บึงโขงหลง', 'ศรีวิไล', 'บุ่งคล้า'
  ],
  'buriram': [
    'เมืองบุรีรัมย์', 'คูเมือง', 'กระสัง', 'นางรอง', 'หนองกี่', 'ละหานทราย', 'ประโคนชัย', 'บ้านกรวด', 'พุทไธสง', 
    'ลำปลายมาศ', 'สตึก', 'ปะคำ', 'นาโพธิ์', 'หนองหงส์', 'พลับพลาชัย', 'ห้วยราช', 'โนนสุวรรณ', 'ชำนิ', 
    'บ้านใหม่ไชยพจน์', 'โนนดินแดง', 'บ้านด่าน', 'แคนดง', 'เฉลิมพระเกียรติ'
  ],
  'mahasarakham': [
    'เมืองมหาสารคาม', 'แกดำ', 'โกสุมพิสัย', 'กันทรวิชัย', 'เชียงยืน', 'บรบือ', 'นาเชือก', 'พยัคฆภูมิพิสัย', 
    'วาปีปทุม', 'นาดูน', 'ยางสีสุราช', 'กุดรัง', 'ชื่นชม'
  ],
  'mukdahan': [
    'เมืองมุกดาหาร', 'นิคมคำสร้อย', 'ดอนตาล', 'ดงหลวง', 'คำชะอี', 'หว้านใหญ่', 'หนองสูง'
  ],
  'yasothon': [
    'เมืองยโสธร', 'ทรายมูล', 'กุดชุม', 'คำเขื่อนแก้ว', 'ป่าติ้ว', 'มหาชนะชัย', 'ค้อวัง', 'เลิงนกทา', 'ไทยเจริญ'
  ],
  'roiet': [
    'เมืองร้อยเอ็ด', 'เกษตรวิสัย', 'ปทุมรัตต์', 'จตุรพักตรพิมาน', 'ธวัชบุรี', 'พนมไพร', 'โพนทอง', 'โพธิ์ชัย', 
    'หนองพอก', 'เสลภูมิ', 'สุวรรณภูมิ', 'เมืองสรวง', 'โพนทราย', 'อาจสามารถ', 'เมยวดี', 'ศรีสมเด็จ', 'จังหาร', 
    'เชียงขวัญ', 'หนองฮี', 'ทุ่งเขาหลวง'
  ],
  'loei': [
    'เมืองเลย', 'นาด้วง', 'เชียงคาน', 'ปากชม', 'ด่านซ้าย', 'นาแห้ว', 'ภูเรือ', 'ท่าลี่', 'วังสะพุง', 
    'ภูกระดึง', 'ภูหลวง', 'ผาขาว', 'เอราวัณ', 'หนองหิน'
  ],
  'sisaket': [
    'เมืองศรีสะเกษ', 'ยางชุมน้อย', 'กันทรารมย์', 'กันทรลักษ์', 'ขุขันธ์', 'ไพรบึง', 'ปรางค์กู่', 'ขุนหาญ', 
    'ราษีไศล', 'อุทุมพรพิสัย', 'บึงบูรพ์', 'ห้วยทับทัน', 'โนนคูณ', 'ศรีรัตนะ', 'น้ำเกลี้ยง', 'วังหิน', 
    'ภูสิงห์', 'เมืองจันทร์', 'เบญจลักษ์', 'พยุห์', 'โพธิ์ศรีสุวรรณ', 'ศิลาลาด'
  ],
  'sakonnakhon': [
    'เมืองสกลนคร', 'กุสุมาลย์', 'กุดบาก', 'พรรณานิคม', 'พังโคน', 'วาริชภูมิ', 'นิคมน้ำอูน', 'วานรนิวาส', 
    'คำตากล้า', 'บ้านม่วง', 'อากาศอำนวย', 'สว่างแดนดิน', 'ส่องดาว', 'เต่างอย', 'โคกศรีสุพรรณ', 'เจริญศิลป์', 
    'โพนนาแก้ว', 'ภูพาน'
  ],
  'surin': [
    'เมืองสุรินทร์', 'ชุมพลบุรี', 'ท่าตูม', 'จอมพระ', 'ปราสาท', 'กาบเชิง', 'รัตนบุรี', 'สนม', 'ศีขรภูมิ', 
    'สังขะ', 'ลำดวน', 'สำโรงทาบ', 'บัวเชด', 'พนมดงรัก', 'ศรีณรงค์', 'เขวาสินรินทร์', 'โนนนารายณ์'
  ],
  'nongkhai': [
    'เมืองหนองคาย', 'ท่าบ่อ', 'โพนพิสัย', 'ศรีเชียงใหม่', 'สังคม', 'สระใคร', 'เฝ้าไร่', 'รัตนวาปี', 'โพธิ์ตาก'
  ],
  'nongbualamphu': [
    'เมืองหนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง'
  ],
  'amnatcharoen': [
    'เมืองอำนาจเจริญ', 'ชานุมาน', 'ปทุมราชวงศา', 'พนา', 'เสนางคนิคม', 'หัวตะพาน', 'ลืออำนาจ'
  ],
  'udonthani': [
    'เมืองอุดรธานี', 'กุดจับ', 'หนองวัวซอ', 'กุมภวาปี', 'โนนสะอาด', 'หนองหาน', 'ทุ่งฝน', 'ไชยวาน', 'ศรีธาตุ', 
    'วังสามหมอ', 'บ้านดุง', 'บ้านผือ', 'น้ำโสม', 'เพ็ญ', 'สร้างคอม', 'หนองแสง', 'นายูง', 'พิบูลย์รักษ์', 
    'กู่แก้ว', 'ประจักษ์ศิลปาคม'
  ],
  'ubonratchathani': [
    'เมืองอุบลราชธานี', 'ศรีเมืองใหม่', 'โขงเจียม', 'เขื่องใน', 'เขมราฐ', 'เดชอุดม', 'นาจะหลวย', 'น้ำยืน', 
    'บุณฑริก', 'ตระการพืชผล', 'กุดข้าวปุ้น', 'ม่วงสามสิบ', 'วารินชำราบ', 'พิบูลมังสาหาร', 'ตาลสุม', 'โพธิ์ไทร', 
    'สำโรง', 'ดอนมดแดง', 'สิรินธร', 'ทุ่งศรีอุดม', 'นาเยีย', 'นาตาล', 'เหล่าเสือโก้ก', 'สว่างวีระวงศ์', 'น้ำขุ่น'
  ],

  // --- ภาคกลาง (22 จังหวัด - รวม กทม.) ---
  'bangkok': [
    'พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ', 'ปทุมวัน', 'ป้อมปราบศัตรูพ่าย', 'พระโขนง', 
    'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา', 'สัมพันธวงศ์', 'พญาไท', 'ธนบุรี', 'บางกอกใหญ่', 'ห้วยขวาง', 'คลองสาน', 
    'ตลิ่งชัน', 'บางกอกน้อย', 'บางขุนเทียน', 'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ', 'บางพลัด', 'ดินแดง', 
    'บึงกุ่ม', 'สาทร', 'บางซื่อ', 'จตุจักร', 'บางคอแหลม', 'ประเวศ', 'คลองเตย', 'สวนหลวง', 'จอมทอง', 
    'ดอนเมือง', 'ราชเทวี', 'ลาดพร้าว', 'วัฒนา', 'บางแค', 'หลักสี่', 'สายไหม', 'คันนายาว', 'สะพานสูง', 
    'วังทองหลาง', 'คลองสามวา', 'บางนา', 'ทวีวัฒนา', 'ทุ่งครุ', 'บางบอน'
  ],
  'kamphaengphet': [
    'เมืองกำแพงเพชร', 'ไทรงาม', 'คลองลาน', 'ขาณุวรลักษบุรี', 'คลองขลุง', 'พรานกระต่าย', 'ลานกระบือ', 
    'ทรายทองวัฒนา', 'ปางศิลาทอง', 'บึงสามัคคี', 'โกสัมพีนคร'
  ],
  'chainat': [
    'เมืองชัยนาท', 'มโนรมย์', 'วัดสิงห์', 'สรรพยา', 'สรรคบุรี', 'หันคา', 'หนองมะโมง', 'เนินขาม'
  ],
  'nakhonnayok': [
    'เมืองนครนายก', 'ปากพลี', 'บ้านนา', 'องครักษ์'
  ],
  'nakhonpathom': [
    'เมืองนครปฐม', 'กำแพงแสน', 'นครชัยศรี', 'ดอนตูม', 'บางเลน', 'สามพราน', 'พุทธมณฑล'
  ],
  'nakhonsawan': [
    'เมืองนครสวรรค์', 'โกรกพระ', 'ชุมแสง', 'หนองบัว', 'บรรพตพิสัย', 'เก้าเลี้ยว', 'ตาคลี', 'ท่าตะโก', 
    'ไพศาลี', 'พยุหะคีรี', 'ลาดยาว', 'ตากฟ้า', 'แม่วงก์', 'แม่เปิน', 'ชุมตาบง'
  ],
  'nonthaburi': [
    'เมืองนนทบุรี', 'บางกรวย', 'บางใหญ่', 'บางบัวทอง', 'ไทรน้อย', 'ปากเกร็ด'
  ],
  'pathumthani': [
    'เมืองปทุมธานี', 'คลองหลวง', 'ธัญบุรี', 'หนองเสือ', 'ลาดหลุมแก้ว', 'ลำลูกกา', 'สามโคก'
  ],
  'ayutthaya': [
    'พระนครศรีอยุธยา', 'ท่าเรือ', 'นครหลวง', 'บางไทร', 'บางบาล', 'บางปะอิน', 'บางปะหัน', 'ผักไห่', 
    'ภาชี', 'ลาดบัวหลวง', 'วังน้อย', 'เสนา', 'บางซ้าย', 'อุทัย', 'มหาราช', 'บ้านแพรก'
  ],
  'phichit': [
    'เมืองพิจิตร', 'วังทรายพูน', 'โพธิ์ประทับช้าง', 'ตะพานหิน', 'บางมูลนาก', 'โพทะเล', 'สามง่าม', 
    'ทับคล้อ', 'สากเหล็ก', 'บึงนาราง', 'ดงเจริญ', 'วชิรบารมี'
  ],
  'phitsanulok': [
    'เมืองพิษณุโลก', 'นครไทย', 'ชาติตระการ', 'บางระกำ', 'บางกระทุ่ม', 'พรหมพิราม', 'วัดโบสถ์', 
    'วังทอง', 'เนินมะปราง'
  ],
  'phetchabun': [
    'เมืองเพชรบูรณ์', 'ชนแดน', 'หล่มสัก', 'หล่มเก่า', 'วิเชียรบุรี', 'ศรีเทพ', 'หนองไผ่', 'บึงสามพัน', 
    'น้ำหนาว', 'วังโป่ง', 'เขาค้อ'
  ],
  'lopburi': [
    'เมืองลพบุรี', 'พัฒนานิคม', 'โคกสำโรง', 'ชัยบาดาล', 'ท่าวุ้ง', 'บ้านหมี่', 'ท่าหลวง', 'สระโบสถ์', 
    'โคกเจริญ', 'ลำสนธิ', 'หนองม่วง'
  ],
  'samutprakan': [
    'เมืองสมุทรปราการ', 'บางบ่อ', 'บางพลี', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางเสาธง'
  ],
  'samutsongkhram': [
    'เมืองสมุทรสงคราม', 'บางคนที', 'อัมพวา'
  ],
  'samutsakhon': [
    'เมืองสมุทรสาคร', 'กระทุ่มแบน', 'บ้านแพ้ว'
  ],
  'saraburi': [
    'เมืองสระบุรี', 'แก่งคอย', 'หนองแค', 'วิหารแดง', 'หนองแซง', 'บ้านหมอ', 'ดอนพุด', 'หนองโดน', 
    'พระพุทธบาท', 'เสาไห้', 'มวกเหล็ก', 'วังม่วง', 'เฉลิมพระเกียรติ'
  ],
  'singburi': [
    'เมืองสิงห์บุรี', 'บางระจัน', 'ค่ายบางระจัน', 'พรหมบุรี', 'ท่าช้าง', 'อินทร์บุรี'
  ],
  'sukhothai': [
    'เมืองสุโขทัย', 'บ้านด่านลานหอย', 'คีรีมาศ', 'กงไกรลาศ', 'ศรีสัชนาลัย', 'ศรีสำโรง', 'สวรรคโลก', 
    'ศรีนคร', 'ทุ่งเสลี่ยม'
  ],
  'suphanburi': [
    'เมืองสุพรรณบุรี', 'เดิมบางนางบวช', 'ด่านช้าง', 'บางปลาม้า', 'ศรีประจันต์', 'ดอนเจดีย์', 
    'สองพี่น้อง', 'สามชุก', 'อู่ทอง', 'หนองหญ้าไซ'
  ],
  'angthong': [
    'เมืองอ่างทอง', 'ไชโย', 'ป่าโมก', 'โพธิ์ทอง', 'แสวงหา', 'วิเศษชัยชาญ', 'สามโก้'
  ],
  'uthaithani': [
    'เมืองอุทัยธานี', 'ทัพทัน', 'สว่างอารมณ์', 'หนองฉาง', 'หนองขาหย่าง', 'บ้านไร่', 'ลานสัก', 'ห้วยคต'
  ],

  // --- ภาคตะวันออก (7 จังหวัด) ---
  'chanthaburi': [
    'เมืองจันทบุรี', 'ขลุง', 'ท่าใหม่', 'โป่งน้ำร้อน', 'มะขาม', 'แหลมสิงห์', 'สอยดาว', 'แก่งหางแมว', 
    'นายายอาม', 'เขาคิชฌกูฏ'
  ],
  'chachoengsao': [
    'เมืองฉะเชิงเทรา', 'บางคล้า', 'บางน้ำเปรี้ยว', 'บางปะกง', 'บ้านโพธิ์', 'พนมสารคาม', 'ราชสาส์น', 
    'สนามชัยเขต', 'แปลงยาว', 'ท่าตะเกียบ', 'คลองเขื่อน'
  ],
  'chonburi': [
    'เมืองชลบุรี', 'บ้านบึง', 'หนองใหญ่', 'บางละมุง', 'พานทอง', 'พนัสนิคม', 'ศรีราชา', 'เกาะสีชัง', 
    'สัตหีบ', 'บ่อทอง', 'เกาะจันทร์'
  ],
  'trat': [
    'เมืองตราด', 'คลองใหญ่', 'เขาสมิง', 'บ่อไร่', 'แหลมงอบ', 'เกาะกูด', 'เกาะช้าง'
  ],
  'prachinburi': [
    'เมืองปราจีนบุรี', 'กบินทร์บุรี', 'นาดี', 'สระแก้ว', 'บ้านสร้าง', 'ประจันตคาม', 'ศรีมหาโพธิ', 
    'ศรีมโหสถ'
  ],
  'rayong': [
    'เมืองระยอง', 'บ้านฉาง', 'แกลง', 'วังจันทร์', 'บ้านค่าย', 'ปลวกแดง', 'เขาชะเมา', 'นิคมพัฒนา'
  ],
  'sakaeo': [
    'เมืองสระแก้ว', 'คลองหาด', 'ตาพระยา', 'วังน้ำเย็น', 'วัฒนานคร', 'อรัญประเทศ', 'เขาฉกรรจ์', 
    'โคกสูง', 'วังสมบูรณ์'
  ],

  // --- ภาคตะวันตก (5 จังหวัด) ---
  'kanchanaburi': [
    'เมืองกาญจนบุรี', 'ไทรโยค', 'บ่อพลอย', 'ศรีสวัสดิ์', 'ท่ามะกา', 'ท่าม่วง', 'ทองผาภูมิ', 'สังขละบุรี', 
    'พนมทวน', 'เลาขวัญ', 'ด่านมะขามเตี้ย', 'หนองปรือ', 'ห้วยกระเจา'
  ],
  'tak': [
    'เมืองตาก', 'บ้านตาก', 'สามเงา', 'แม่สอด', 'แม่ระมาด', 'ท่าสองยาง', 'อุ้มผาง', 'พบพระ', 'วังเจ้า'
  ],
  'prachuapkhirikhan': [
    'เมืองประจวบคีรีขันธ์', 'กุยบุรี', 'ทับสะแก', 'บางสะพาน', 'บางสะพานน้อย', 'ปราณบุรี', 'หัวหิน', 
    'สามร้อยยอด'
  ],
  'phetchaburi': [
    'เมืองเพชรบุรี', 'เขาย้อย', 'หนองหญ้าปล้อง', 'ชะอำ', 'ท่ายาง', 'บ้านลาด', 'บ้านแหลม', 'แก่งกระจาน'
  ],
  'ratchaburi': [
    'เมืองราชบุรี', 'จอมบึง', 'สวนผึ้ง', 'ดำเนินสะดวก', 'บ้านโป่ง', 'บางแพ', 'โพธาราม', 'ปากท่อ', 
    'วัดเพลง', 'บ้านคา'
  ],

  // --- ภาคใต้ (14 จังหวัด) ---
  'krabi': [
    'เมืองกระบี่', 'เขาพนม', 'เกาะลันตา', 'คลองท่อม', 'อ่าวลึก', 'ปลายพระยา', 'ลำทับ', 'เหนือคลอง'
  ],
  'chumphon': [
    'เมืองชุมพร', 'ท่าแซะ', 'ปะทิว', 'หลังสวน', 'ละแม', 'พะโต๊ะ', 'สวี', 'ทุ่งตะโก'
  ],
  'trang': [
    'เมืองตรัง', 'กันตัง', 'ย่านตาขาว', 'ปะเหลียน', 'สิเกา', 'ห้วยยอด', 'วังวิเศษ', 'นาโยง', 'รัษฎา', 
    'หาดสำราญ'
  ],
  'nakhonsithammarat': [
    'เมืองนครศรีธรรมราช', 'พรหมคีรี', 'ลานสกา', 'ฉวาง', 'พิปูน', 'เชียรใหญ่', 'ชะอวด', 'ท่าศาลา', 
    'ทุ่งสง', 'นาบอน', 'ทุ่งใหญ่', 'ปากพนัง', 'ร่อนพิบูลย์', 'สิชล', 'ขนอม', 'หัวไทร', 'บางขัน', 
    'ถ้ำพรรณรา', 'จุฬาภรณ์', 'พระพรหม', 'นบพิตำ', 'ช้างกลาง', 'เฉลิมพระเกียรติ'
  ],
  'narathiwat': [
    'เมืองนราธิวาส', 'ตากใบ', 'บาเจาะ', 'ยี่งอ', 'ระแงะ', 'รือเสาะ', 'ศรีสาคร', 'แว้ง', 'สุคิริน', 
    'สุไหงโก-ลก', 'สุไหงปาดี', 'จะแนะ', 'เจาะไอร้อง'
  ],
  'pattani': [
    'เมืองปัตตานี', 'โคกโพธิ์', 'หนองจิก', 'ปะนาเระ', 'มายอ', 'ทุ่งยางแดง', 'สายบุรี', 'ไม้แก่น', 
    'ยะหริ่ง', 'ยะรัง', 'กะพ้อ', 'แม่ลาน'
  ],
  'phangnga': [
    'เมืองพังงา', 'เกาะยาว', 'กะปง', 'ตะกั่วทุ่ง', 'ตะกั่วป่า', 'คุระบุรี', 'ทับปุด', 'ท้ายเหมือง'
  ],
  'phatthalung': [
    'เมืองพัทลุง', 'กงหรา', 'เขาชัยสน', 'ตะโหมด', 'ควนขนุน', 'ปากพะยูน', 'ศรีบรรพต', 'ป่าบอน', 
    'บางแก้ว', 'ป่าพะยอม', 'ศรีนครินทร์'
  ],
  'phuket': [
    'เมืองภูเก็ต', 'กะทู้', 'ถลาง'
  ],
  'yala': [
    'เมืองยะลา', 'เบตง', 'บันนังสตา', 'ธารโต', 'ยะหา', 'รามัน', 'กาบัง', 'กรงปินัง'
  ],
  'ranong': [
    'เมืองระนอง', 'ละอุ่น', 'กะเปอร์', 'กระบุรี', 'สุขสำราญ'
  ],
  'songkhla': [
    'เมืองสงขลา', 'สทิงพระ', 'จะนะ', 'นาทวี', 'เทพา', 'สะบ้าย้อย', 'ระโนด', 'กระแสสินธุ์', 
    'รัตภูมิ', 'สะเดา', 'หาดใหญ่', 'นาหม่อม', 'ควนเนียง', 'บางกล่ำ', 'สิงหนคร', 'คลองหอยโข่ง'
  ],
  'satun': [
    'เมืองสตูล', 'ควนโดน', 'ควนกาหลง', 'ท่าแพ', 'ละงู', 'ทุ่งหว้า', 'มะนัง'
  ],
  'suratthani': [
    'เมืองสุราษฎร์ธานี', 'กาญจนดิษฐ์', 'ดอนสัก', 'เกาะสมุย', 'เกาะพะงัน', 'ไชยา', 'ท่าชนะ', 'คีรีรัฐนิคม', 
    'บ้านตาขุน', 'พนม', 'ท่าฉาง', 'บ้านนาสาร', 'บ้านนาเดิม', 'เคียนซา', 'เวียงสระ', 'พระแสง', 
    'พุนพิน', 'ชัยบุรี', 'วิภาวดี'
  ]
};

// --- HELPER FUNCTIONS ---
const getDistricts = (provinceId: string): District[] => {
  if (MOCK_DISTRICTS[provinceId]) {
    return MOCK_DISTRICTS[provinceId].map((name, i) => ({ id: `${provinceId}_${i}`, name }));
  }
  return Array.from({ length: 6 }, (_, i) => ({ 
    id: `${provinceId}_${i}`, 
    name: `อำเภอเมือง${i === 0 ? '' : 'จำลอง' + i}` 
  }));
};

// --- COMPONENT PROPS ---
interface ZoomableThailandMapProps {
  onSelectRegion: (regionId: string | null) => void;
  onSelectProvince: (province: Province) => void;
  selectedRegion: string | null;
  selectedProvinceId: string | undefined;
}

// --- COMPONENT: ZOOMABLE THAILAND MAP ---
const ZoomableThailandMap: React.FC<ZoomableThailandMapProps> = ({ 
  onSelectRegion, 
  onSelectProvince, 
  selectedRegion, 
  selectedProvinceId 
}) => {
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleZoom = (delta: number) => {
    setTransform(prev => {
      const newK = Math.max(1, Math.min(5, prev.k + delta));
      return { ...prev, k: newK };
    });
  };

  const handleReset = () => setTransform({ x: 0, y: 0, k: 1 });

  const getRegionStyle = (regionId: string) => {
    const region = PLACES_DATA.regions.find(r => r.id === regionId);
    if (!region) return { fill: '#e5e7eb', stroke: '#d1d5db' };
    
    if (selectedRegion && selectedRegion !== regionId) {
       return { fill: '#f3f4f6', stroke: '#e5e7eb', opacity: 0.5 };
    }
    return { fillClass: region.fill, strokeClass: region.stroke };
  };

  return (
    <div className="relative w-full h-[600px] bg-blue-50/50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={() => handleZoom(0.5)} className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-700" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={() => handleZoom(-0.5)} className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-700" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
        <button onClick={handleReset} className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 text-gray-700" title="Reset View"><Maximize className="w-5 h-5" /></button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-100 z-10 hidden sm:block">
        <p className="text-xs font-semibold text-gray-500 mb-2">สัญลักษณ์</p>
        <div className="flex flex-col gap-1">
          {PLACES_DATA.regions.map(r => (
             <div key={r.id} className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onSelectRegion(r.id)}>
               <div className={`w-2 h-2 rounded-full ${r.color}`}></div>
               <span className="text-[10px] text-gray-600">{r.name}</span>
             </div>
          ))}
        </div>
      </div>

      <div className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center" style={{ touchAction: 'none' }}>
        <svg viewBox="0 0 350 650" className="h-full transition-transform duration-300 ease-out" style={{ transform: `scale(${transform.k}) translate(${transform.x}px, ${transform.y}px)` }} ref={svgRef}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g>
            {/* North */}
            <path d="M85,15 L110,10 L150,20 L180,40 L190,70 L170,100 L160,130 L100,140 L70,120 L60,80 L70,40 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('north').fillClass || ''} ${getRegionStyle('north').strokeClass || ''}`} style={getRegionStyle('north').fill ? { fill: getRegionStyle('north').fill, stroke: getRegionStyle('north').stroke, opacity: getRegionStyle('north').opacity } : {}} onClick={() => onSelectRegion('north')} />
            {/* Northeast */}
            <path d="M160,130 L190,70 L250,75 L300,90 L320,150 L310,210 L270,240 L210,240 L200,210 L180,200 L185,160 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('northeast').fillClass || ''} ${getRegionStyle('northeast').strokeClass || ''}`} style={getRegionStyle('northeast').fill ? { fill: getRegionStyle('northeast').fill, stroke: getRegionStyle('northeast').stroke, opacity: getRegionStyle('northeast').opacity } : {}} onClick={() => onSelectRegion('northeast')} />
            {/* West */}
            <path d="M70,120 L100,140 L110,180 L100,250 L80,280 L80,330 L100,350 L70,330 L50,280 L50,200 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('west').fillClass || ''} ${getRegionStyle('west').strokeClass || ''}`} style={getRegionStyle('west').fill ? { fill: getRegionStyle('west').fill, stroke: getRegionStyle('west').stroke, opacity: getRegionStyle('west').opacity } : {}} onClick={() => onSelectRegion('west')} />
            {/* Central */}
            <path d="M110,180 L185,160 L180,200 L200,210 L190,260 L150,280 L120,270 L100,250 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('central').fillClass || ''} ${getRegionStyle('central').strokeClass || ''}`} style={getRegionStyle('central').fill ? { fill: getRegionStyle('central').fill, stroke: getRegionStyle('central').stroke, opacity: getRegionStyle('central').opacity } : {}} onClick={() => onSelectRegion('central')} />
            {/* East */}
            <path d="M190,260 L210,240 L270,240 L260,280 L230,310 L200,300 L190,280 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('east').fillClass || ''} ${getRegionStyle('east').strokeClass || ''}`} style={getRegionStyle('east').fill ? { fill: getRegionStyle('east').fill, stroke: getRegionStyle('east').stroke, opacity: getRegionStyle('east').opacity } : {}} onClick={() => onSelectRegion('east')} />
            {/* South */}
            <path d="M100,350 L120,350 L130,380 L120,450 L140,500 L130,580 L90,560 L70,500 L80,450 L70,380 Z" className={`transition-all duration-300 stroke-[1.5] cursor-pointer ${getRegionStyle('south').fillClass || ''} ${getRegionStyle('south').strokeClass || ''}`} style={getRegionStyle('south').fill ? { fill: getRegionStyle('south').fill, stroke: getRegionStyle('south').stroke, opacity: getRegionStyle('south').opacity } : {}} onClick={() => onSelectRegion('south')} />
          </g>
          <g>
            {ALL_PROVINCES.map((p) => {
              const isSelected = selectedProvinceId === p.id;
              const isRegionMatch = selectedRegion ? p.region === selectedRegion : true;
              const isDimmed = !isRegionMatch && !isSelected;

              return (
                <g key={p.id} onClick={(e) => { e.stopPropagation(); onSelectProvince(p); }} className={`cursor-pointer transition-opacity duration-300 ${isDimmed ? 'opacity-10 pointer-events-none' : 'opacity-100 hover:opacity-100'}`}>
                  {isSelected && (<circle cx={p.x} cy={p.y} r="8" className="fill-none stroke-blue-500 stroke-2 animate-ping opacity-75" />)}
                  <circle cx={p.x} cy={p.y} r="6" className="fill-transparent" />
                  <circle cx={p.x} cy={p.y} r={isSelected ? 3 : 2} className={`transition-colors duration-200 ${isSelected ? 'fill-blue-600 stroke-white stroke-[1.5]' : 'fill-gray-700 stroke-white stroke-[0.5]'} hover:fill-blue-500`} />
                  <text x={p.x} y={p.y - 4} textAnchor="middle" className={`text-[5px] font-bold pointer-events-none select-none transition-all duration-200 ${isSelected ? 'fill-blue-700 text-[6px] opacity-100 font-extrabold' : 'fill-gray-600 opacity-60 hover:opacity-100'} ${transform.k < 1.5 && !isSelected ? 'opacity-0' : ''}`} style={{ textShadow: '0 1px 2px white' }}>{p.name}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function TourismPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fullSelectedProvince = useMemo(() => {
    if (!selectedProvince) return null;
    return ALL_PROVINCES.find(p => p.id === selectedProvince.id) || selectedProvince;
  }, [selectedProvince]);

  const districtList = useMemo(() => {
    if (!fullSelectedProvince) return [];
    return getDistricts(fullSelectedProvince.id);
  }, [fullSelectedProvince]);

  const filteredProvinces = useMemo(() => {
    return ALL_PROVINCES.filter(p => {
      const matchRegion = selectedRegion ? p.region === selectedRegion : true;
      const matchSearch = p.name.includes(searchTerm);
      return matchRegion && matchSearch;
    });
  }, [selectedRegion, searchTerm]);

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    if (!selectedRegion) {
      setSelectedRegion(province.region);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term !== '') {
       const match = ALL_PROVINCES.find(p => p.name.includes(term));
       if (match) setSelectedRegion(match.region);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSelectedRegion(null); setSelectedProvince(null);}}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Map className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Thailand Data</h1>
              <p className="text-xs text-gray-500">ฐานข้อมูล 77 จังหวัด</p>
            </div>
          </div>
          <div className="relative w-48 md:w-80">
            <input type="text" placeholder="ค้นหาจังหวัด..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-300 rounded-full text-sm outline-none transition-all shadow-inner" value={searchTerm} onChange={handleSearch} />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAP & CONTROLS */}
          <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col gap-6">
            <div className="bg-white p-1 rounded-3xl shadow-xl shadow-slate-200/50 border border-white">
              <ZoomableThailandMap 
                onSelectRegion={setSelectedRegion}
                onSelectProvince={handleProvinceSelect}
                selectedRegion={selectedRegion}
                selectedProvinceId={selectedProvince?.id}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PLACES_DATA.regions.map(r => (
                <button key={r.id} onClick={() => setSelectedRegion(selectedRegion === r.id ? null : r.id)} className={`text-xs py-2 px-1 rounded-lg border transition-all truncate ${selectedRegion === r.id ? `${r.color} text-white border-transparent shadow-md` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {r.name.replace('ภาค', '')}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-full lg:w-7/12 xl:w-2/3">
            {fullSelectedProvince ? (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-6 animate-in slide-in-from-right-4 duration-500">
                <div className="h-48 bg-gray-200 relative">
                   <img src={`https://source.unsplash.com/800x400/?thailand,${fullSelectedProvince.name}`} className="w-full h-full object-cover" alt={fullSelectedProvince.name} onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1590422589334-a714c6e6b604?auto=format&fit=crop&q=80&w=800"; }} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                   <button onClick={() => setSelectedProvince(null)} className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-colors">
                     <ArrowLeft className="w-5 h-5" />
                   </button>
                   <div className="absolute bottom-6 left-6 text-white">
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-white/20 backdrop-blur-sm mb-2 inline-block border border-white/30`}>
                        {PLACES_DATA.regions.find(r => r.id === fullSelectedProvince.region)?.name}
                      </span>
                      <h2 className="text-4xl font-bold">{fullSelectedProvince.name}</h2>
                   </div>
                </div>
                
                <div className="p-6">
                   <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                         <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Compass className="w-5 h-5"/></div>
                         <div>
                           <p className="text-xs text-gray-500">ภูมิภาค</p>
                           <p className="font-semibold text-gray-800">{PLACES_DATA.regions.find(r => r.id === fullSelectedProvince.region)?.name}</p>
                         </div>
                      </div>
                      <div className="flex-1 bg-purple-50 rounded-xl p-4 flex items-center gap-3">
                         <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><MapPin className="w-5 h-5"/></div>
                         <div>
                           <p className="text-xs text-gray-500">จำนวนอำเภอ</p>
                           <p className="font-semibold text-gray-800">{districtList.length} อำเภอ</p>
                         </div>
                      </div>
                   </div>

                   {/* --- DISTRICT SELECTOR --- */}
                   <div className="mb-8">
                     <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                       <Map className="w-5 h-5 text-gray-400" />
                       เลือกอำเภอ
                     </h3>
                     <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                       {districtList.map((district) => (
                         <button
                           key={district.id}
                           onClick={() => setSelectedDistrict(selectedDistrict?.id === district.id ? null : district)}
                           className={`px-4 py-2 rounded-full text-sm border transition-all ${
                             selectedDistrict?.id === district.id
                               ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                               : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                           }`}
                         >
                           {district.name}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="border-t border-gray-100 pt-6">
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <Camera className="w-5 h-5 text-gray-400" />
                       {selectedDistrict ? `สถานที่ท่องเที่ยวใน ${selectedDistrict.name}` : 'สถานที่ท่องเที่ยวแนะนำ'}
                     </h3>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer bg-white group">
                             <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                                <img src={`https://source.unsplash.com/200x200/?thailand,travel,${fullSelectedProvince.id},${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Attraction"/>
                             </div>
                             <div className="flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-sm">
                                      {selectedDistrict ? selectedDistrict.name : districtList[i % districtList.length]?.name || 'เมือง'}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-gray-800 text-sm line-clamp-1">
                                    {selectedDistrict ? `จุดเช็คอิน ${selectedDistrict.name} ${i}` : `แหล่งท่องเที่ยว ${fullSelectedProvince.name} ${i}`}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    สัมผัสบรรยากาศ{selectedDistrict ? 'อันเงียบสงบและสวยงามของ' + selectedDistrict.name : 'วัฒนธรรมท้องถิ่นและธรรมชาติที่สวยงาม'}...
                                  </p>
                                </div>
                                <span className="text-[10px] text-blue-500 flex items-center gap-1 font-medium group-hover:underline">
                                  ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                   </div>
                </div>
              </div>
            ) : (
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 min-h-[600px]">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedRegion ? `จังหวัดใน${PLACES_DATA.regions.find(r => r.id === selectedRegion)?.name}` : 'รายชื่อจังหวัดทั้งหมด'}
                    </h2>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-500">{filteredProvinces.length} จังหวัด</span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProvinces.map(p => {
                       const region = PLACES_DATA.regions.find(r => r.id === p.region);
                       return (
                         <div key={p.id} onClick={() => handleProvinceSelect(p)} className="p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group bg-white">
                            <div className="flex items-center gap-2 mb-2">
                               <div className={`w-2 h-2 rounded-full ${region?.color}`}></div>
                               <span className="text-[10px] text-gray-400">{region?.name.replace('ภาค','')}</span>
                            </div>
                            <h3 className="font-bold text-gray-700 group-hover:text-blue-600">{p.name}</h3>
                         </div>
                       );
                    })}
                 </div>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}