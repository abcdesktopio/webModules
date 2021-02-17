import { workerData } from 'worker_threads';
import fs from 'fs';

async function bootstrap() {
  const { filename, searchValue, replaceValue } = workerData;
  const svgContent = await fs.promises.readFile(filename, 'utf8');
  if (svgContent.includes(replaceValue)) {
    const newContent = svgContent.replace(new RegExp(searchValue, 'g'), replaceValue);
    await fs.promises.writeFile(filename, newContent);
  }
}

bootstrap()
  .catch(console.error);
