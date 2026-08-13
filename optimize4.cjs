const fs = require('fs');

function optimizeStudentPortal(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /const enrolledMods: Module\[\] = \[\];\s*for \(const m of mods\) \{\s*const docRef = doc\(db, `modules\/\$\{m\.id\}\/enrollments`, student\.id\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*enrolledMods\.push\(m\);\s*\}\s*\}/g,
    `const enrolledMods = (await Promise.all(mods.map(async m => {
          const docSnap = await getDoc(doc(db, \`modules/\${m.id}/enrollments\`, student.id));
          return docSnap.exists() ? m : null;
        }))).filter(Boolean) as Module[];`
  );

  content = content.replace(
    /for \(const m of enrolledMods\) \{\s*const lecsSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/lectures`\)\);\s*lecsSnap\.docs\.forEach\(d => \{\s*allLecs\.push\(\{ mod: m, lec: \{ id: d\.id, \.\.\.d\.data\(\) \} \}\);\s*\}\);\s*const assignmentsSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/assignments`\)\);\s*assignmentsCount \+= assignmentsSnap\.docs\.length;\s*\/\/ For results we can just mock or fetch\s*const resultsSnap = await getDocs\(collection\(db, `students\/\$\{student\.id\}\/results`\)\)\.catch\(\(\) => \(\{ docs: \[\] \}\)\);\s*resultsCount = resultsSnap\.docs\.length \|\| 0;\s*\}/g,
    `await Promise.all(enrolledMods.map(async m => {
          const [lecsSnap, assignmentsSnap] = await Promise.all([
            getDocs(collection(db, \`modules/\${m.id}/lectures\`)),
            getDocs(collection(db, \`modules/\${m.id}/assignments\`))
          ]);
          lecsSnap.docs.forEach(d => {
            allLecs.push({ mod: m, lec: { id: d.id, ...d.data() } });
          });
          assignmentsCount += assignmentsSnap.docs.length;
        }));
        const resultsSnap = await getDocs(collection(db, \`students/\${student.id}/results\`)).catch(() => ({ docs: [] }));
        resultsCount = resultsSnap.docs.length || 0;`
  );

  fs.writeFileSync(filePath, content);
}
optimizeStudentPortal('src/components/StudentPortal.tsx');
