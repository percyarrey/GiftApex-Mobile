const fs = require('fs');
const parser = require('@babel/parser');
const path = 'app/(support)/chat/[id].tsx';
const src = fs.readFileSync(path, 'utf8');
try {
    parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('OK');
} catch (e) {
    console.error(e.message);
    console.error(JSON.stringify(e.loc));
    process.exit(1);
}
