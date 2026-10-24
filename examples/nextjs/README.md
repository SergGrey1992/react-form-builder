# Next.js App Router example

Из корня: `npm ci && npm run prepare:examples`. Затем здесь: `npm ci && npm run build && npm start`.

Глобальный client Provider, server layout/page, SSR с AntdRegistry, Ant Design Input/Checkbox/Select, типизированные слоты и сохранение черновика через опубликованный react-hook-form-persist/local. `loading` блокирует взаимодействие до восстановления; успешный submit очищает черновик. При смене структуры данных измените ключ/миграцию по правилам persistence-пакета.
