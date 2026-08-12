const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

code = code.replace(
  /\} catch \(err\) \{\s+if \(isMounted && errorCb\) errorCb\(err\);\s+\} finally \{/,
  `} catch (err: any) {
      if (err?.message?.includes('timed out')) {
        // ignore polling timeouts silently
      } else if (isMounted && errorCb) {
        errorCb(err);
      }
    } finally {`
);

fs.writeFileSync('src/lib/db.ts', code);
