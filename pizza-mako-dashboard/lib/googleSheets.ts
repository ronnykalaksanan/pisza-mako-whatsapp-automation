import { google, sheets_v4 } from "googleapis";

/**
 * Helper terpusat untuk baca/tulis Google Sheets Pizza Mako.
 * Dipakai HANYA di sisi server (API routes) - jangan pernah import
 * file ini dari komponen client, karena private key ada di sini.
 */

let cachedClient: sheets_v4.Sheets | null = null;

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY belum di-set di environment variables."
    );
  }

  // Vercel env vars menyimpan \n secara literal, perlu di-convert jadi newline asli
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  if (cachedClient) return cachedClient;
  const auth = getAuthClient();
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID belum di-set di environment variables.");
  return id;
}

/**
 * Baca semua row dari sebuah tab/sheet, dan kembalikan sebagai array of object,
 * dengan header (baris 1) sebagai key.
 */
export async function readSheetAsObjects(sheetName: string): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}`,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  return body.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key: string, i: number) => {
      obj[key] = row[i] ?? "";
    });
    return obj;
  });
}

/**
 * Update satu cell tertentu berdasarkan nomor baris (1-indexed, termasuk header)
 * dan nama kolom (dicocokkan ke header).
 */
export async function updateCellByRow(
  sheetName: string,
  rowNumber: number,
  columnName: string,
  value: string
) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Ambil header dulu untuk cari index kolom
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });
  const header = headerRes.data.values?.[0] || [];
  const colIndex = header.indexOf(columnName);
  if (colIndex === -1) {
    throw new Error(`Kolom "${columnName}" tidak ditemukan di tab "${sheetName}".`);
  }
  const colLetter = columnIndexToLetter(colIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

/**
 * Append satu baris baru ke akhir sebuah tab, berdasarkan mapping { namaKolom: nilai }.
 * Kolom yang tidak ada di mapping akan dikosongkan sesuai urutan header.
 */
export async function appendRow(sheetName: string, rowData: Record<string, string | number>) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });
  const header = headerRes.data.values?.[0] || [];
  const row = header.map((col: string) => rowData[col] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

function columnIndexToLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

/**
 * Cari baris berdasarkan nilai di 1 kolom (misal "Nomor WA"). Kalau ketemu,
 * update kolom-kolom yang dikasih. Kalau belum ada, buat baris baru.
 * Dipakai untuk kasus "jeda manual" - admin bisa jeda nomor yang belum
 * tentu sudah pernah order sebelumnya (belum ada row CRM-nya).
 */
export async function upsertRowByColumn(
  sheetName: string,
  matchColumn: string,
  matchValue: string,
  values: Record<string, string | number>
) {
  const rows = await readSheetAsObjects(sheetName);
  const existingIndex = rows.findIndex((r) => r[matchColumn] === matchValue);

  if (existingIndex === -1) {
    await appendRow(sheetName, { [matchColumn]: matchValue, ...values });
    return;
  }

  const rowNumber = existingIndex + 2; // baris 1 = header
  for (const [col, val] of Object.entries(values)) {
    await updateCellByRow(sheetName, rowNumber, col, String(val));
  }
}
