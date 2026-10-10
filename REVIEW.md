# Architecture review

## Початковий аналіз архітектури

| Principle          | Evidence (file:line)     | Practical risk    | Fix            |
| Information hiding | `src/checkout/CheckoutController.ts:3,22-28` | Checkout створює Stripe-specific payload. Додавання другого provider вимагатиме зміни контролера та поширюватиме знання про provider за межі Payments. | Передавати оплату через provider-neutral контракт Payments, приховавши формування payload усередині adapter. |
| Low coupling / dependency direction | `src/orders/OrderService.ts:3-5,8-12` | Orders безпосередньо імпортує StripeClient та StripePayload з internal. Зміна платіжної реалізації може спричинити зміни Orders. | Залежати від публічного контракту Payments, а конкретний adapter вибирати всередині платіжного модуля або через його конфігурацію. |
| Ownership / high cohesion | `src/orders/OrderService.ts:15-26` | Orders сам читає та змінює stock storage. Правило доступності товару не захищене єдиним власником, а помилка на наступній позиції може залишити попередню позицію списаною. | Передати Inventory відповідальність за атомарне резервування всіх потрібних позицій і повертати однозначну помилку без часткових змін. |
| Explicit contracts / ownership | `src/inventory/StockRepository.ts:8-10` | Метод `updateAvailable` дозволяє зовнішньому коду встановити довільний залишок, включно з від'ємним, без перевірки бізнес-правил. | Замінити низькорівневий запис операцією резервування або іншою контрольованою командою, що захищає invariant `available >= 0`. |
| Information hiding / high cohesion | `src/orders/mapPaymentStatus.ts:1-6`; `src/reports/mapPaymentStatus.ts:1-6`; `src/notifications/mapPaymentStatus.ts:1-6` | Три модулі повторюють provider-specific mapping. Новий статус або provider вимагатиме синхронних змін у кількох місцях, створюючи ризик різної інтерпретації однієї відповіді. | Зосередити перетворення provider response на нормалізований статус у Payments і надавати споживачам лише стабільні статуси системи. |
| Dependency direction / ownership | `src/payments/internal/StripeClient.ts:1-2,16-21` | Payments імпортує внутрішню функцію Orders і змінює стан замовлення під час створення платежу. Це створює зворотну залежність і ускладнює ізольоване тестування обох модулів. | Нехай Payments повертає нормалізований результат, а Orders відповідає за оновлення замовлення після отримання результату. |
| Local reasoning / information hiding | `src/shared/calculateTotal.ts:1,10-22` | Розрахунок залежить від глобальної конфігурації, мутує вхідні `lines` і записує audit log. Результат та побічні ефекти складніше перевіряти незалежно. | Передавати tax і discount явно, не змінювати вхідні позиції та виконувати audit logging в orchestration після розрахунку. |

## Change impact prediction

**Requirement:**

Додати другий локальний payment provider та нормалізований статус `processing`, зберігши публічний Checkout API і наявну поведінку статусів `paid` та `failed`. Приховати provider-specific payload, response і статуси всередині Payments. Додатково посилити ownership Inventory, прибрати циклічні залежності та зробити розрахунок total детермінованим.

**Expected files:**

- `src/checkout/CheckoutController.ts` — прибрати залежність від Stripe payload, передавати оплату через стабільний контракт.
- `src/orders/OrderService.ts` — прибрати пряме використання StripeClient і прямий доступ до stock storage; оновлювати замовлення на основі нормалізованого результату оплати.
- `src/orders/internal/orderMutations.ts` — перевірити потребу у внутрішніх операціях після усунення залежності Payments від Orders.
- `src/payments/` — створити provider-neutral public API, нормалізацію статусів, вибір provider і adapters для двох навчальних провайдерів.
- `src/payments/internal/StripeClient.ts` — залишити Stripe-specific деталі всередині Payments і прибрати залежність від Orders.
- `src/orders/mapPaymentStatus.ts`, `src/reports/mapPaymentStatus.ts`, `src/notifications/mapPaymentStatus.ts` — усунути дубльовані provider-specific mapping.
- `src/inventory/StockRepository.ts` — захистити invariant залишків і надати операцію атомарного резервування.
- `src/shared/calculateTotal.ts` — зробити розрахунок чистою функцією з явними входами.
- `src/config.ts` — за потреби зберігати конфігурацію, яку передає orchestration, без прихованого читання її всередині розрахунку.
- `src/database.ts` — за потреби надати Inventory контрольований доступ до сховища, не дозволяючи Orders обходити його API.
- `tests/checkout.functional.test.ts` — зберегти перевірки зовнішньої поведінки Checkout.
- Нові тести Payments — перевірити `paid`, `processing`, `failed` і невідомий статус для нормалізації, а також поведінку обох adapters.
- Нові тести Inventory та `calculateTotal` — перевірити атомарність резервування, відсутність мутацій і детермінованість розрахунку.
- Нові architecture-check файли та `package.json` — автоматично перевіряти заборонені імпорти, записи в Inventory storage та цикли залежностей.
- `DECISIONS.md` — документувати рішення та перевірку кожної суттєвої зміни.
- `ADR-001-payments-boundary.md` — обґрунтувати межу Payments і вимірювані умови можливого винесення в окремий сервіс.
- `README.md` — вказати автора, заявлений рівень, команди запуску й архітектурні перевірки.

**Modules that should not change:**

- Публічний контракт Checkout для наявних сценаріїв `paid` і `failed`.
- Зовнішня форма відповіді Checkout: `orderId`, `status`, `total`, `paymentStatus`.
- Поведінка наявних функціональних сценаріїв, зафіксована стартовими тестами.
- Код Reports і Notifications, якщо вони споживають лише нормалізовані статуси системи; їхні дубльовані mapping-файли можна видалити або замінити використанням контракту Payments без поширення provider-specific знань.
- Бізнес-логіка Checkout, не пов'язана з вибором провайдера, статусами оплати, резервуванням залишків або передаванням параметрів розрахунку.

## Actual impact

**Actual files changed:**

Заповнити після завершення рефакторингу, за результатами `git diff` та `git status`.

**Difference from prediction and explanation:**

Заповнити після реалізації. Порівняти прогнозований список файлів із фактичним, пояснити кожну суттєву відмінність і вказати, чи вдалося локалізувати зміни в модулях-власниках.