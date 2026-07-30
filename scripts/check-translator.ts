import { translateStructuredContent } from '../server/ai-translator';

const result = await translateStructuredContent({
  from: 'ru',
  to: 'en',
  content: {
    title: '\u041d\u043e\u0432\u044b\u0439 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442',
    slug: '\u043d\u043e\u0432\u044b\u0439-\u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442',
    tags: ['\u043d\u0430\u0443\u043a\u0430', '\u043a\u043e\u043c\u0430\u043d\u0434\u0430'],
    url: 'https://navykus.online/test',
  },
});

console.log(JSON.stringify(result, null, 2));
