# backend_lab4

Простий HTTP-сервер на Node.js. Дані у файлі titanic.json у форматі NDJSON.

Встановлення: `npm install` (Node.js 22.12+).

Запуск: `npm start` або `node main.js -i titanic.json -h 127.0.0.1 -p 3000 [-o response.json]`; `npm run dev` з автоматичним перезапуском.

| Запит | Результат |
| --- | --- |
| `GET /` | усі пасажири: name, ticket |
| `GET /?age=true` | додається поле age |
| `GET /?survived=true` | лише пасажири, які вижили |
| інший шлях | 404 |