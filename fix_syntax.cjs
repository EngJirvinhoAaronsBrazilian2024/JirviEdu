const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /allSubs\.push\(\.\.\.mappedSubs\);\s*\} catch \(subErr\) \{\s*console\.error\("Failed fetching submissions for assignment", aDoc\.id, subErr\);\s*\}\s*\}\s*\} catch \(err\) \{\s*console\.error\("Failed fetching assignments\/lectures for module", modDoc\.id, err\);\s*\}\s*\}/g,
    `allSubs.push(...mappedSubs);
              } catch (subErr) {
                console.error("Failed fetching submissions for assignment", aDoc.id, subErr);
              }
            }));
          } catch (err) {
            console.error("Failed fetching assignments/lectures for module", modDoc.id, err);
          }
        }));`
  );
  fs.writeFileSync(filePath, content);
}
fix('src/components/AdminPortal.tsx');
