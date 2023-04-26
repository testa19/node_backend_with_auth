// function reading from json file 
// Path: src/services/test.ts
import fs from 'fs';

function readFile(file: fs.PathOrFileDescriptor) {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
}
export const getTest = async () => {
  const data = await readFile('src/services/test.json');
  return JSON.parse(data);
}