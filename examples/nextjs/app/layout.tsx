import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';
export const metadata = { title: 'React Form Builder — Next.js' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
