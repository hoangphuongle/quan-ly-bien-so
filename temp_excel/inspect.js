const XLSX = require('xlsx');
const fs = require('fs');
const filename = fs.readFileSync('/Users/viralworks/Documents/code/Theo dõi tiến độ đăng ký biển số và quản lý tiền thu chi/temp_excel/filename.txt', 'utf8').trim();
const workbook = XLSX.readFile(filename);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log(JSON.stringify(json.slice(0, 50), null, 2));
