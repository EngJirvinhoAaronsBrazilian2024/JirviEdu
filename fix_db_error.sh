#!/bin/bash
file="src/lib/db.ts"

# Find authenticateStudent and add error handling
sed -i -E 's/const snap = await fbGetDoc\(fbDoc\(firestore, '\''student_passwords'\'', data.id\)\);/try { const snap = await fbGetDoc(fbDoc(firestore, '\''student_passwords'\'', data.id)); if (!snap.exists()) return null; const hash = snap.data()?.passwordHash; if (!hash) return null; let isValid = false; if (hash.startsWith('\''$2'\'')) { isValid = await compare(passwordStr, hash); } else { isValid = hash === passwordStr; } if (!isValid) return null; return { id: data.id, data: () => resultData }; } catch (error) { console.error("Firebase auth error:", error); return null; }/g' "$file"

