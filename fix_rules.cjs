const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const helpers = `
    function isValidWriter(data) {
      return data.artistName is string &&
             data.isPublished is bool &&
             data.createdAt is string &&
             (!('bio' in data) || data.bio is string) &&
             (!('country' in data) || data.country is string) &&
             (!('city' in data) || data.city is string) &&
             (!('profileImageUrl' in data) || data.profileImageUrl is string) &&
             (!('coverImageUrl' in data) || data.coverImageUrl is string) &&
             (!('instagramUrl' in data) || data.instagramUrl is string) &&
             (!('userId' in data) || data.userId is string);
    }

    function isValidExhibition(data) {
      return data.title is string &&
             data.description is string &&
             data.isPublished is bool &&
             data.createdAt is string &&
             (!('subtitle' in data) || data.subtitle is string) &&
             (!('coverImageUrl' in data) || data.coverImageUrl is string) &&
             (!('dateStart' in data) || data.dateStart is string) &&
             (!('dateEnd' in data) || data.dateEnd is string) &&
             (!('isFeatured' in data) || data.isFeatured is bool) &&
             (!('writerIds' in data) || data.writerIds is list);
    }

    function isValidArticle(data) {
      return data.title is string &&
             data.slug is string &&
             data.content is string &&
             data.isPublished is bool &&
             data.createdAt is string &&
             (!('author' in data) || data.author is string) &&
             (!('coverImageUrl' in data) || data.coverImageUrl is string) &&
             (!('tags' in data) || data.tags is list);
    }
`;

const rules = `
    match /writers/{writerId} {
      allow read: if true;
      allow create, update: if isAdmin() && isValidWriter(request.resource.data);
      allow delete: if isAdmin();
    }

    match /exhibitions/{exhibitionId} {
      allow read: if true;
      allow create, update: if isAdmin() && isValidExhibition(request.resource.data);
      allow delete: if isAdmin();
    }

    match /articles/{articleId} {
      allow read: if true;
      allow create, update: if isAdmin() && isValidArticle(request.resource.data);
      allow delete: if isAdmin();
    }
`;

code = code.replace(
  /\/\/ ===============================================================\n    \/\/ Rules/,
  helpers + '\n    // ===============================================================\n    // Rules'
);

code = code.replace(
  /match \/faqs\/\{faqId\} \{/,
  rules + '\n    match /faqs/{faqId} {'
);

fs.writeFileSync('firestore.rules', code);
