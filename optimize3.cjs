const fs = require('fs');

function optimizeAdminPortal(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /for \(const modDoc of modulesSnap\.docs\) \{\s*const modData = modDoc\.data\(\) as any;\s*modGrades\[modData\.code\] = \{ total: 0, count: 0 \};\s*try \{\s*const \[assignmentsSnap, lecturesSnap\] = await Promise\.all\(\[\s*getDocs\(collection\(db, `modules\/\$\{modDoc\.id\}\/assignments`\)\)\.catch\(\(\) => \(\{ docs: \[\] \}\)\),\s*getDocs\(collection\(db, `modules\/\$\{modDoc\.id\}\/lectures`\)\)\.catch\(\(\) => \(\{ docs: \[\] \}\)\)\s*\]\);\s*assignmentsCount \+= assignmentsSnap\.docs\.length;\s*lecturesCount \+= lecturesSnap\.docs\.length;\s*for \(const aDoc of assignmentsSnap\.docs\) \{\s*const aData = aDoc\.data\(\) as any;\s*try \{\s*const subsSnap = await getDocs\(collection\(db, `modules\/\$\{modDoc\.id\}\/assignments\/\$\{aDoc\.id\}\/submissions`\)\);/g,
    `await Promise.all(modulesSnap.docs.map(async modDoc => {
          const modData = modDoc.data() as any;
          modGrades[modData.code] = { total: 0, count: 0 };
          try {
            const [assignmentsSnap, lecturesSnap] = await Promise.all([
              getDocs(collection(db, \`modules/\${modDoc.id}/assignments\`)).catch(() => ({ docs: [] })),
              getDocs(collection(db, \`modules/\${modDoc.id}/lectures\`)).catch(() => ({ docs: [] }))
            ]);
            
            assignmentsCount += assignmentsSnap.docs.length;
            lecturesCount += lecturesSnap.docs.length;

            await Promise.all(assignmentsSnap.docs.map(async aDoc => {
              const aData = aDoc.data() as any;
              try {
                const subsSnap = await getDocs(collection(db, \`modules/\${modDoc.id}/assignments/\${aDoc.id}/submissions\`));`
  );
  
  // Also we need to close the mapped function
  content = content.replace(
    /allSubs\.push\(\.\.\.mappedSubs\);\s*\} catch \(subErr\) \{\s*console\.warn\("Failed submissions for assignment", subErr\);\s*\}\s*\}\s*\} catch \(err\) \{\s*console\.warn\("Failed to load module details", err\);\s*\}\s*\}/g,
    `allSubs.push(...mappedSubs);
              } catch (subErr) {
                console.warn("Failed submissions for assignment", subErr);
              }
            }));
          } catch (err) {
            console.warn("Failed to load module details", err);
          }
        }));`
  );
  
  fs.writeFileSync(filePath, content);
}
optimizeAdminPortal('src/components/AdminPortal.tsx');
