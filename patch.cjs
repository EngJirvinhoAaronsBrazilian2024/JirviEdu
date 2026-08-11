const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');
code = code.replace(/export async function authenticateStudent([\s\S]*?^})/m, `export async function authenticateStudent(regNumber: string, passwordStr: string) {
  try {
    let q: any = insforge.database.from('students').select('*').eq('reg_number', regNumber);
    const { data, error } = await q.single();
    if (error) console.error("Error fetching student:", error);
    if (!data) return null;
    let resultData = snakeToCamel(data);
    
    const { data: passData, error: passError } = await insforge.database.from('student_passwords').select('*').eq('id', data.id).single();
    if (passError) console.error("Error fetching password:", passError);
    if (!passData) return null;
    
    const hashStr = passData.password_hash;
    if (!hashStr) return null;
    let isValid = false;
    if (hashStr.startsWith('$2')) {
      isValid = await compare(passwordStr, hashStr);
    } else {
      isValid = hashStr === passwordStr;
    }
    if (!isValid) return null;
    return { id: data.id, data: () => resultData };
  } catch (error) {
    console.warn("Auth failed:", error);
    return null;
  }
}`);
fs.writeFileSync('src/lib/db.ts', code);
