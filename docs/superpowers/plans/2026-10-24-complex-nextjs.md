# Complex Next.js example implementation plan

Goal: интерактивная сложная вложенная форма, которой удобно управлять и изучать.
Architecture: один useForm; листовые FormBuilder слоты; native useFieldArray в дочерних компонентах; Promise mock API и hook с защитой от stale responses.

- [x] Написать тесты mock API и stale requests, запустить red, реализовать model.ts / mock-api.ts / use-options.ts.
- [x] Реализовать расширенный локальный Ant Design адаптер и конфигурацию полей, динамические массивы и зависимые селекты.
- [x] Реализовать ApplicationForm, панель управления и live inspector, стили и обновить README.
- [x] Проверить вложенные append/remove/move, валидацию, async submit, persistence и моковые селекты; typecheck / tests / production build.
- [x] Независимое ревью и браузерная проверка; исправить найденное и повторить проверки.

Review focus: stale requests; смена indices родительских массивов; ref-циклы в errors JSON; hidden fields; clear draft; form-level busy и кнопки type=button.

Ревью: обязательность пустых массивов исправлена required-правилами на всех пяти уровнях; покрыто RED→GREEN тестами. Дополнительно устранено предупреждение Ant Design 5 / React 19 официальным patch-пакетом.
