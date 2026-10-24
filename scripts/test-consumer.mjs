import process from 'node:process';
import { Console } from 'node:console';
import { URL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const console = new Console(process.stdout, process.stderr);
const root = fileURLToPath(new URL('..', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'form-builder-consumer-'));
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
try {
  run('npm', ['pack', '--pack-destination', temporary]);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const archive = join(
    temporary,
    `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`,
  );
  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      archive,
      'react@19',
      'react-hook-form@7',
      '@types/react@19',
      'typescript@6',
    ],
    temporary,
  );
  writeFileSync(
    join(temporary, 'consumer.tsx'),
    `import {createFormBuilder,createFormAdapter,defineField} from '@serggrey1992/react-form-builder';
import {useForm} from 'react-hook-form';
import type {ComponentProps} from 'react';
const Input=(p:ComponentProps<'input'>)=><input {...p}/>;
const kit=createFormBuilder({adapter:createFormAdapter({fields:{text:defineField({component:Input,bind:({field,controlProps})=>({...controlProps,...field})})}})});
const login=kit.defineFields<{email:string}>()([{name:'email',type:'text'}]);
export function Example(){const form=useForm({defaultValues:{email:''}});return <login.Form form={form}><login.Form.Slot name="email" props={{autoComplete:'email'}}/></login.Form>}
// @ts-expect-error nonexistent field
<login.Form.Slot name="bad"/>;
`,
  );
  run(
    process.execPath,
    [
      resolve(temporary, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--jsx',
      'react-jsx',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      'consumer.tsx',
    ],
    temporary,
  );
  run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import {createFormBuilder} from '@serggrey1992/react-form-builder'; if(typeof createFormBuilder!=='function') throw Error('missing export')",
    ],
    temporary,
  );
  const js = readFileSync(join(root, 'dist/index.js'), 'utf8');
  if (!/^['"]use client['"];/.test(js)) throw Error('Missing client directive');
  if (pkg.dependencies?.react || pkg.dependencies?.['react-hook-form'])
    throw Error('React and RHF must remain peers');
  console.log('Packed ESM + TypeScript consumer: OK');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
