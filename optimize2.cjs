const fs = require('fs');

function optimizePerformance(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /for \(const modDoc of modulesSnap\.docs\) \{\s*const modData = modDoc\.data\(\);\s*const assignmentsSnap = await getDocs\(collection\(db, `modules\/\$\{modDoc\.id\}\/assignments`\)\);\s*for \(const aDoc of assignmentsSnap\.docs\) \{\s*const aData = aDoc\.data\(\);\s*const subDoc = await getDoc\(doc\(db, `modules\/\$\{modDoc\.id\}\/assignments\/\$\{aDoc\.id\}\/submissions`, student\.id\)\);\s*if \(subDoc\.exists\(\)\) \{\s*const subData = subDoc\.data\(\);\s*if \(subData\.grade !== undefined && aData\.marks\) \{\s*const pct = \(Number\(subData\.grade\) \/ Number\(aData\.marks\)\) \* 100;\s*grades\.push\(\{\s*name: aData\.title,\s*grade: Math\.round\(pct\),\s*date: subData\.submittedAt\s*\}\);\s*totalPct \+= pct;\s*count\+\+;\s*\}\s*\}\s*\}\s*\}/g,
    `await Promise.all(modulesSnap.docs.map(async modDoc => {
          const assignmentsSnap = await getDocs(collection(db, \`modules/\${modDoc.id}/assignments\`));
          await Promise.all(assignmentsSnap.docs.map(async aDoc => {
            const aData = aDoc.data();
            const subDoc = await getDoc(doc(db, \`modules/\${modDoc.id}/assignments/\${aDoc.id}/submissions\`, student.id));
            if (subDoc.exists()) {
              const subData = subDoc.data();
              if (subData.grade !== undefined && aData.marks) {
                const pct = (Number(subData.grade) / Number(aData.marks)) * 100;
                grades.push({
                  name: aData.title,
                  grade: Math.round(pct),
                  date: subData.submittedAt
                });
                totalPct += pct;
                count++;
              }
            }
          }));
        }));`
  );
  fs.writeFileSync(filePath, content);
}
optimizePerformance('src/components/admin/StudentPerformance.tsx');


function optimizeTimetable(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /if \(studentId\) \{\s*for \(const m of mods\) \{\s*const docRef = doc\(db, `modules\/\$\{m\.id\}\/enrollments`, studentId\);\s*const docSnap = await getDoc\(docRef\);\s*if \(docSnap\.exists\(\)\) \{\s*enrolledMods\.push\(m\);\s*\}\s*\}\s*\} else if \(assignedModules\) \{\s*for \(const m of mods\) \{\s*if \(assignedModules\.includes\(m\.id\)\) \{\s*enrolledMods\.push\(m\);\s*\}\s*\}\s*\}/g,
    `if (studentId) {
          const validMods = await Promise.all(mods.map(async m => {
            const docSnap = await getDoc(doc(db, \`modules/\${m.id}/enrollments\`, studentId));
            return docSnap.exists() ? m : null;
          }));
          enrolledMods.push(...validMods.filter(Boolean));
        } else if (assignedModules) {
          for (const m of mods) {
            if (assignedModules.includes(m.id)) {
              enrolledMods.push(m);
            }
          }
        }`
  );
  content = content.replace(
    /const allLecs: \{mod: Module, lec: any\}\[\] = \[\];\s*for \(const m of \(studentId \|\| assignedModules\) \? enrolledMods : mods\) \{\s*const lecsSnap = await getDocs\(collection\(db, `modules\/\$\{m\.id\}\/lectures`\)\);\s*lecsSnap\.docs\.forEach\(d => \{\s*allLecs\.push\(\{ mod: m, lec: \{ id: d\.id, \.\.\.d\.data\(\) \} \}\);\s*\}\);\s*\}/g,
    `const targetMods = (studentId || assignedModules) ? enrolledMods : mods;
        const allLecs = (await Promise.all(targetMods.map(async m => {
          const lecsSnap = await getDocs(collection(db, \`modules/\${m.id}/lectures\`));
          return lecsSnap.docs.map(d => ({ mod: m, lec: { id: d.id, ...d.data() } }));
        }))).flat();`
  );

  content = content.replace(
    /const interval = setInterval\(fetchLectures, 3000\);\s*const unsub = mutationEmitter\.subscribe\(fetchLectures\);\s*return \(\) => \{\s*isMounted = false;\s*clearInterval\(interval\);\s*unsub\(\);\s*\};/g,
    `const unsub = mutationEmitter.subscribe(fetchLectures);
    return () => {
      isMounted = false;
      unsub();
    };`
  );
  fs.writeFileSync(filePath, content);
}
optimizeTimetable('src/components/Timetable.tsx');

