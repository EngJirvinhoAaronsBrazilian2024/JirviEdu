const fs = require('fs');

function optimizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace sequential enrolledMods fetch
  content = content.replace(
    /const enrolledMods: Module\[\] = \[\];\s*for \(const m of mods\) \{\s*const docRef = doc\(db, `modules\/\$\{m\.id\}\/enrollments`, studentId\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*enrolledMods\.push\(m\);\s*\}\s*\}/g,
    `const enrolledMods = (await Promise.all(mods.map(async m => {
          const docSnap = await getDoc(doc(db, \`modules/\${m.id}/enrollments\`, studentId));
          return docSnap.exists() ? m : null;
        }))).filter(Boolean) as Module[];`
  );

  // Replace sequential lectures fetch
  content = content.replace(
    /const allLecs: \{mod: Module, lec: any\}\[\] = \[\];\s*for \(const m of enrolledMods\) \{\s*const lecsSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/lectures`\)\);\s*for \(const lecDoc of lecsSnap\.docs\) \{\s*allLecs\.push\(\{ mod: m, lec: \{ id: lecDoc\.id, \.\.\.lecDoc\.data\(\) \} \}\);\s*\}\s*\}/g,
    `const allLecs = (await Promise.all(enrolledMods.map(async m => {
          const lecsSnap = await getDocs(collection(db, \`modules/\${m.id}/lectures\`));
          return lecsSnap.docs.map(lecDoc => ({ mod: m, lec: { id: lecDoc.id, ...lecDoc.data() } }));
        }))).flat();`
  );

  // Replace sequential materials fetch
  content = content.replace(
    /const allMat: \{mod: Module, mat: any\}\[\] = \[\];\s*for \(const m of enrolledMods\) \{\s*const matSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/learningMaterials`\)\);\s*for \(const matDoc of matSnap\.docs\) \{\s*allMat\.push\(\{ mod: m, mat: \{ id: matDoc\.id, \.\.\.matDoc\.data\(\) \} \}\);\s*\}\s*\}/g,
    `const allMat = (await Promise.all(enrolledMods.map(async m => {
          const matSnap = await getDocs(collection(db, \`modules/\${m.id}/learningMaterials\`));
          return matSnap.docs.map(matDoc => ({ mod: m, mat: { id: matDoc.id, ...matDoc.data() } }));
        }))).flat();`
  );

  // Replace sequential assignments fetch
  content = content.replace(
    /const allAsn: \{mod: Module, asn: any, sub: any \| null\}\[\] = \[\];\s*for \(const m of enrolledMods\) \{\s*const asnSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/assignments`\)\);\s*for \(const asnDoc of asnSnap\.docs\) \{\s*const asnData = \{ id: asnDoc\.id, \.\.\.asnDoc\.data\(\) \};\s*\/\/ Check for submission\s*const subDocRef = doc\(db, `modules\/\$\{m\.id\}\/assignments\/\$\{asnDoc\.id\}\/submissions`, studentId\);\s*const subDocSnap = await getDoc\(subDocRef\);\s*allAsn\.push\(\{ \s*mod: m, \s*asn: asnData,\s*sub: subDocSnap\.exists\(\) \? subDocSnap\.data\(\) : null\s*\}\);\s*\}\s*\}/g,
    `const allAsn = (await Promise.all(enrolledMods.map(async m => {
          const asnSnap = await getDocs(collection(db, \`modules/\${m.id}/assignments\`));
          return Promise.all(asnSnap.docs.map(async asnDoc => {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            const subDocSnap = await getDoc(doc(db, \`modules/\${m.id}/assignments/\${asnDoc.id}/submissions\`, studentId));
            return { mod: m, asn: asnData, sub: subDocSnap.exists() ? subDocSnap.data() : null };
          }));
        }))).flat();`
  );

  // Replace StudentResults sequential fetch
  content = content.replace(
    /const gradedSubmissions: \{mod: Module, asn: any, sub: any\}\[\] = \[\];\s*for \(const m of mods\) \{\s*const asnSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/assignments`\)\);\s*for \(const asnDoc of asnSnap\.docs\) \{\s*const asnData = \{ id: asnDoc\.id, \.\.\.asnDoc\.data\(\) \};\s*\/\/ Check for submission\s*const subDocRef = doc\(db, `modules\/\$\{m\.id\}\/assignments\/\$\{asnDoc\.id\}\/submissions`, student\.id\);\s*const subDocSnap = await getDoc\(subDocRef\);\s*if \(subDocSnap\.exists\(\)\) \{\s*const subData = subDocSnap\.data\(\) as any;\s*if \(subData\.grade !== undefined && subData\.grade !== null\) \{\s*gradedSubmissions\.push\(\{ \s*mod: m, \s*asn: asnData,\s*sub: subData\s*\}\);\s*\}\s*\}\s*\}\s*\}/g,
    `const gradedSubmissions = (await Promise.all(mods.map(async m => {
          const asnSnap = await getDocs(collection(db, \`modules/\${m.id}/assignments\`));
          const subs = await Promise.all(asnSnap.docs.map(async asnDoc => {
            const asnData = { id: asnDoc.id, ...asnDoc.data() };
            const subDocSnap = await getDoc(doc(db, \`modules/\${m.id}/assignments/\${asnDoc.id}/submissions\`, student.id));
            if (subDocSnap.exists()) {
              const subData = subDocSnap.data() as any;
              if (subData.grade !== undefined && subData.grade !== null) {
                return { mod: m, asn: asnData, sub: subData };
              }
            }
            return null;
          }));
          return subs.filter(Boolean);
        }))).flat();`
  );

  // Remove setInterval polling from student components and rely only on mutationEmitter
  content = content.replace(
    /const interval = setInterval\((fetch[a-zA-Z]+), 3000\);\s*const unsub = mutationEmitter\.subscribe\(\1\);\s*return \(\) => \{\s*isMounted = false;\s*clearInterval\(interval\);\s*unsub\(\);\s*\};/g,
    `const unsub = mutationEmitter.subscribe($1);
    return () => {
      isMounted = false;
      unsub();
    };`
  );

  fs.writeFileSync(filePath, content);
}

optimizeFile('src/components/student/StudentAssignments.tsx');
optimizeFile('src/components/student/StudentLectures.tsx');
optimizeFile('src/components/student/StudentMaterials.tsx');
optimizeFile('src/components/student/StudentResults.tsx');
