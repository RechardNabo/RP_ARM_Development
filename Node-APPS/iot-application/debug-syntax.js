// Simple script to help identify syntax errors
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'app/api/system/metrics/route.ts',
  'components/dashboard/system-status.tsx',
  'lib/services/system-metrics-service.ts'
];

function checkSyntax(filePath) {
  console.log(`Checking ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`✅ File read successfully: ${filePath}`);
    
    // Try to tokenize the file which would fail on unclosed brackets, etc.
    let openBraces = 0;
    let openBrackets = 0;
    let openParens = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
      if (char === '(') openParens++;
      if (char === ')') openParens--;
    }
    
    console.log(`Stats for ${filePath}:`);
    console.log(`- Braces balance: ${openBraces} (should be 0)`);
    console.log(`- Brackets balance: ${openBrackets} (should be 0)`);
    console.log(`- Parentheses balance: ${openParens} (should be 0)`);
    
    if (openBraces !== 0 || openBrackets !== 0 || openParens !== 0) {
      console.log(`⚠️ Possible syntax error in ${filePath}`);
    } else {
      console.log(`✅ No obvious syntax errors in ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error reading or parsing ${filePath}: ${error.message}`);
  }
  console.log('\n');
}

console.log('Checking for syntax errors in modified files...\n');

for (const file of filesToCheck) {
  checkSyntax(path.join(__dirname, file));
}
